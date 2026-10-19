import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import IntakeShell from "@/views/intake/components/IntakeShell";
import {
  ALL_DETAILS_FIELDS,
  DetailsFields,
  DetailsIntro,
  IdentityFieldInput,
  FormActions,
  FormLabel,
  PageLayout,
  StepTitle,
  detailsPagesOrDefault,
  layoutEnv,
  nextDetailsTitle,
  unsupportedLayout,
  useNextLabel,
  type DetailsPage,
} from "@/shared/form-renderer";
import { IDENTITY_FIELDS, identityError } from "@/lib/theme/identityFields";
import { usePublicIntakeForm, useStartPublicIntake } from "@/hooks/intake/useIntake";
import { saveIntakeToken } from "@/lib/intakeToken";
import type { IdentityThemeField } from "@/types/intake/theme_types";

type Values = Record<IdentityThemeField, string>;
const EMPTY: Values = { firstName: "", lastName: "", dob: "", email: "", phone: "" };

/**
 * The public storefront door: `/intake/public?formKey=…&productId=…`.
 *
 * A stranger fills in their details, we mint a token (`POST /api/intake/public/start`), persist
 * it, and hand off to the normal walk at `/intake/<token>`. Every refusal is a flat 404 → one
 * "not available" message.
 *
 * Drawn with the same themed parts as the walk. Its title and theme come from
 * `GET /api/intake/public/:formKey` (partner from this page's address, plus the form's own theme),
 * so it looks like the questions after it; each field also wears `identity.<field>`.
 * See `branding/theme-rules.md` § identity.
 *
 * The details can be split over several pages (`detailsPages`, Documents/hidden-details-pages-titles.md
 * §2): each asks for its share of the fields, under its own layout when it has one (the fields go
 * where its `detailsForm` node is) and its title. All in the browser: Next checks that page's fields
 * with the same rules `/start` uses, Back keeps what was typed, and only the last page calls
 * `/start`, once, with everything. If `/start` still refuses a field, the patient is taken back to
 * the page that holds it. A layout with a part this app doesn't know is refused rather than drawn
 * half (forms/steps-layout-computed.md §2).
 */

function readQuery(): { formKey: string; productId: string } {
  if (typeof window === "undefined") return { formKey: "", productId: "" };
  const q = new URLSearchParams(window.location.search);
  return { formKey: q.get("formKey") ?? "", productId: q.get("productId") ?? "" };
}

/** The identity fields a `/start` validation refusal names (`issues[].path` = ["identity", field]). */
function refusedFields(err: unknown): IdentityThemeField[] {
  const d = (err as { details?: unknown } | null)?.details as
    | { issues?: unknown; error?: { issues?: unknown } }
    | undefined;
  const issues = Array.isArray(d?.issues) ? d.issues : Array.isArray(d?.error?.issues) ? d.error.issues : [];
  const out: IdentityThemeField[] = [];
  for (const i of issues as { path?: unknown[] }[]) {
    const f = i?.path?.[0] === "identity" ? i.path[1] : undefined;
    if (typeof f === "string" && (ALL_DETAILS_FIELDS as string[]).includes(f)) out.push(f as IdentityThemeField);
  }
  return out;
}

/** A plain details page: first and last name side by side when both are on it, the rest full width. */
function plainRows(fields: IdentityThemeField[]): IdentityThemeField[][] {
  const names = fields.includes("firstName") && fields.includes("lastName");
  const rows: IdentityThemeField[][] = [];
  for (const f of fields) {
    if (names && f === "lastName") continue;
    rows.push(names && f === "firstName" ? ["firstName", "lastName"] : [f]);
  }
  return rows;
}

function NextButton({ title, onClick, disabled }: { title?: string | undefined; onClick: () => void; disabled: boolean }) {
  const label = useNextLabel(title, "Continue");
  return (
    <button onClick={onClick} disabled={disabled} className="apx-button-primary">
      {label}
    </button>
  );
}

export default function PublicIntakeStart() {
  const { formKey, productId } = readQuery();
  const start = useStartPublicIntake();
  const form = usePublicIntakeForm(formKey);
  const theme = form.data?.theme ?? null;
  const title = form.data?.title ?? null;
  // `layout` alone: a backend from before details pages (one page, all five fields).
  const stored = form.data?.detailsPages;
  const legacyTree = form.data?.layout ?? null;
  const pages: DetailsPage[] = useMemo(
    () =>
      detailsPagesOrDefault(
        stored !== undefined ? stored : legacyTree ? [{ id: "details", fields: ALL_DETAILS_FIELDS, tree: legacyTree }] : null,
      ),
    [stored, legacyTree],
  );
  const env = useMemo(() => layoutEnv({ fields: [], values: {} }), []);

  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  // A field shows its error once it's been left, or after Next / Start was pressed.
  const [touched, setTouched] = useState<Partial<Record<IdentityThemeField, boolean>>>({});
  // Fields `/start` refused that the browser's checks let through.
  const [refused, setRefused] = useState<Partial<Record<IdentityThemeField, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [notAvailable, setNotAvailable] = useState(!formKey);

  const at = Math.min(index, pages.length - 1);
  const page = pages[at]!;
  const last = at === pages.length - 1;
  const layoutProblem = page.tree ? unsupportedLayout(page.tree) : null;

  // A new page starts at the top, as a new screen would.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [at]);

  const errorOf = (f: IdentityThemeField) =>
    identityError(f, values[f]) ?? (refused[f] ? "Please check this and try again." : null);
  const shownError = (f: IdentityThemeField) => (touched[f] ? errorOf(f) : null);
  const setValue = (f: IdentityThemeField, v: string) => {
    setValues((s) => ({ ...s, [f]: v }));
    if (refused[f]) setRefused((r) => ({ ...r, [f]: false }));
  };
  const touch = (fields: IdentityThemeField[]) =>
    setTouched((t) => ({ ...t, ...Object.fromEntries(fields.map((f) => [f, true])) }));

  const field = (f: IdentityThemeField) => ({
    spec: IDENTITY_FIELDS[f],
    value: values[f],
    onChange: (v: string) => setValue(f, v),
    onBlur: () => touch([f]),
    error: shownError(f),
  });

  /** The first page holding one of `fields`, so the patient lands where the problem is. */
  const goToFirst = (fields: IdentityThemeField[]) => {
    const i = pages.findIndex((p) => p.fields.some((f) => fields.includes(f)));
    if (i >= 0) setIndex(i);
    touch(fields);
  };

  const next = () => {
    setError(null);
    touch(page.fields);
    if (page.fields.some((f) => errorOf(f))) return;
    setIndex(at + 1);
  };

  const submit = async () => {
    setError(null);
    const asked = pages.flatMap((p) => p.fields);
    const bad = asked.filter((f) => errorOf(f));
    if (bad.length) {
      goToFirst(bad);
      return;
    }
    const { firstName, lastName, dob, email, phone } = values;
    try {
      const res = await start.mutateAsync({
        formKey,
        ...(productId ? { productId } : {}),
        identity: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob,
          email: email.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });
      // Persist so a refresh keeps the walk, then hand off to the runtime.
      saveIntakeToken(res.token);
      window.location.assign(`/intake/${encodeURIComponent(res.token)}`);
    } catch (err) {
      // The axios layer normalises errors to `{ status, … }`; `response` only exists on a raw one.
      const e = err as { status?: number; response?: { status?: number } } | null;
      const status = e?.status ?? e?.response?.status;
      const fields = status === 400 ? refusedFields(err) : [];
      if (status === 404) setNotAvailable(true);
      else if (fields.length) {
        setRefused(Object.fromEntries(fields.map((f) => [f, true])));
        goToFirst(fields);
      } else setError("Something went wrong. Please try again.");
    }
  };

  // Same refusals as `/start`: unknown, unpublished, not public, Healthie-sold, another partner's.
  const formStatus = (form.error as { status?: number; response?: { status?: number } } | null)?.status
    ?? (form.error as { response?: { status?: number } } | null)?.response?.status;

  if (notAvailable || formStatus === 404 || formStatus === 400) {
    return (
      <IntakeShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 opacity-40" />
          <h2 className="apx-question-text" style={{ fontSize: "1.2em" }}>
            This form is not available
          </h2>
          <p className="apx-help-text">
            Please check the link, or contact us if you think this is a mistake.
          </p>
        </div>
      </IntakeShell>
    );
  }

  // Wait for the theme rather than flash the Apex look first. Any other failure falls back to it.
  if (form.isLoading) {
    return (
      <IntakeShell>
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin opacity-40" />
        </div>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell theme={theme} title={title}>
      <StepTitle title={page.title} />
      {layoutProblem ? (
        <p className="apx-error" role="alert">
          This form can&apos;t be shown right now. Please try again later.
        </p>
      ) : page.tree ? (
        <PageLayout
          tree={page.tree}
          env={env}
          renderField={() => null}
          renderDetailsForm={(slot) => (
            <DetailsFields
              fields={page.fields}
              values={values}
              onChange={setValue}
              onBlur={(f) => touch([f])}
              errors={Object.fromEntries(page.fields.map((f) => [f, shownError(f)]))}
              columns={slot.columns}
              dobWidget={slot.dobWidget}
            />
          )}
        />
      ) : (
        <>
          {at === 0 && <DetailsIntro />}
          {plainRows(page.fields).map((row) =>
            row.length === 2 ? (
              <div key={row.join("-")} className="grid grid-cols-2 gap-3">
                {row.map((f) => (
                  <IdentityFieldInput key={f} {...field(f)} />
                ))}
              </div>
            ) : (
              <IdentityFieldInput key={row[0]} {...field(row[0]!)} />
            ),
          )}
        </>
      )}

      {error && <p className="apx-error" role="alert">{error}</p>}

      <FormActions>
        {at > 0 && (
          <button onClick={() => setIndex(at - 1)} disabled={start.isPending} className="apx-button-secondary">
            <ArrowLeft className="w-4 h-4" /> <FormLabel name="back" fallback="Back" />
          </button>
        )}
        {last ? (
          <button onClick={submit} disabled={start.isPending || !!layoutProblem} className="apx-button-primary">
            {start.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <FormLabel name="start" fallback="Start" />
          </button>
        ) : (
          <NextButton title={nextDetailsTitle(pages, at)} onClick={next} disabled={!!layoutProblem} />
        )}
      </FormActions>
    </IntakeShell>
  );
}
