import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Dna,
  HeartPulse,
  Loader2,
  Lock,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  ShieldPlus,
  TrendingUp,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { PHYSICIAN, presentationFor, type FeatureIcon, type ProductPresentation } from "@/views/purchase/productPresentation";
import {
  getCheckoutStatus,
  getPublicProduct,
  payCheckout,
  startCheckout,
} from "@/api/healthie/publicPurchase";
import type { CheckoutPayment, PublicProduct, SavedPurchase } from "@/types/healthie/purchase_types";

/**
 * The public buy page for a form sold through Healthie: `/buy/<formKey>`. No login.
 *
 *   1. product   GET  /api/public/products/:formKey   (name, price, Healthie's Stripe key)
 *   2. details   POST /api/public/checkout/start      → purchase token, 30 minutes
 *   3. card      Stripe.js createToken with the product's key → tok_…
 *   4. pay       POST /api/public/checkout/pay
 *   5. done      "check your email to set your password"; the form opens after they log in
 *
 * The visitor pays before answering any question. The purchase token is kept in
 * sessionStorage, never in the URL, so a reload carries on with the same purchase.
 * See `Documents/healthie-ai-form-builder-docs/healthie/public-purchase-api.md`.
 */

const INPUT =
  "w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-foreground outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--apex-accent-bright)] focus:shadow-[0_0_0_3px_var(--apex-accent-soft)]";
const BUTTON =
  "w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--apex-accent-bright)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(211,7,4,0.65)] transition hover:brightness-[1.08] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none";

const FEATURE_ICONS: Record<FeatureIcon, LucideIcon> = {
  dna: Dna,
  user: UserRound,
  shield: ShieldPlus,
  refresh: RefreshCw,
  video: Video,
  calendar: CalendarDays,
  chart: TrendingUp,
  heart: HeartPulse,
};

const storageKey = (formKey: string) => `apex:purchase:${formKey}`;

function readSaved(formKey: string): SavedPurchase | null {
  try {
    const raw = sessionStorage.getItem(storageKey(formKey));
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedPurchase;
    // Expired tokens answer 404; drop it now rather than at Pay.
    return new Date(saved.expiresAt).getTime() > Date.now() ? saved : null;
  } catch {
    return null;
  }
}

function keepSaved(saved: SavedPurchase | null, formKey: string) {
  try {
    if (saved) sessionStorage.setItem(storageKey(formKey), JSON.stringify(saved));
    else sessionStorage.removeItem(storageKey(formKey));
  } catch {
    // Storage blocked: a reload starts over, which `start` handles for an unpaid purchase.
  }
}

/** The app's API errors arrive normalised: `{ status, message, details: <response body> }`. */
function apiError(err: unknown): { status: number | undefined; message: string } {
  const e = err as { status?: number; message?: string; details?: { message?: string } };
  return { status: e?.status, message: e?.details?.message || e?.message || "Something went wrong." };
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formKeyFromPath(): string {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/^\/buy\/([^/]+)\/?$/);
  return m?.[1] ? decodeURIComponent(m[1]) : "";
}

// One Stripe instance per key for the life of the page.
const stripeCache = new Map<string, Promise<Stripe | null>>();
const stripeFor = (key: string) => {
  if (!stripeCache.has(key)) stripeCache.set(key, loadStripe(key));
  return stripeCache.get(key)!;
};

/** The page frame: logo bar and a warm page ground, as on the Apex MD site. */
function BuyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 md:px-9">
          <img src="/images/apex-md-logo.png" alt="Apex MD" className="h-8 w-auto" />
          <a href="/login" className="text-[13px] font-semibold text-ink-2 hover:text-foreground">
            Already a member? <span className="text-[var(--apex-accent-bright)]">Log in</span>
          </a>
        </div>
      </header>
      {children}
      <footer className="border-t border-border py-6 text-center text-[12px] text-[var(--mute)]">
        © {new Date().getFullYear()} Apex MD · Payments are processed securely by Stripe
      </footer>
    </div>
  );
}

/** A single centred card, for loading, unavailable and paid states. */
function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center px-4 py-14 md:py-20">
      <div className="apex-card w-full max-w-xl p-7 md:p-9">{children}</div>
    </div>
  );
}

function Unavailable({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-3 text-center">
      <div className="flex justify-center">
        <AlertCircle className="w-10 h-10 text-[var(--mute)]" />
      </div>
      <h1 className="apex-card-title">{title}</h1>
      <p className="text-[14px] text-ink-2">{text}</p>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--apex-accent-soft)] px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--apex-accent-bright)]">
      <span className="h-2 w-2 rounded-full bg-[var(--apex-accent-bright)]" />
      {children}
    </span>
  );
}

/** Left column: picture, headline, copy and what's included. */
function ProductStory({ product, look }: { product: PublicProduct; look: ProductPresentation | null }) {
  return (
    <div className="min-w-0">
      {look && (
        <div className="overflow-hidden rounded-[22px] border border-border bg-[#17140f] shadow-[0_30px_60px_-30px_rgba(23,20,15,0.55)]">
          <img src={look.image} alt={look.imageAlt} className="block aspect-[3/2] w-full object-cover" />
        </div>
      )}

      <div className={look ? "mt-9" : ""}>
        <Eyebrow>{look?.eyebrow ?? "Apex MD"}</Eyebrow>
        <h1 className="mt-5 text-[clamp(36px,4.6vw,56px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-foreground">
          {look ? (
            <>
              {look.title.lead} <em className="font-extrabold italic text-[var(--apex-accent-bright)]">{look.title.accent}</em>
            </>
          ) : (
            product.name
          )}
        </h1>
        <span className="mt-6 block h-[2px] w-40 bg-[var(--apex-accent-bright)]" />
        {look?.tagline && (
          <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--apex-accent-bright)]">
            {look.tagline}
          </p>
        )}
        {(look?.description || product.description) && (
          <p className="mt-3 max-w-[620px] text-[17px] leading-[1.65] text-ink-2">
            {look?.description ?? product.description}
          </p>
        )}

        {look && look.features.length > 0 && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {look.features.map((f) => {
              const Icon = FEATURE_ICONS[f.icon];
              return (
                <li key={f.title} className="flex items-center gap-4">
                  <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border-2 border-[var(--apex-accent-soft)] bg-card text-[var(--apex-accent-bright)] shadow-[0_6px_16px_-10px_rgba(211,7,4,0.6)]">
                    <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold uppercase tracking-[0.08em] text-foreground">{f.title}</span>
                    {f.text && <span className="mt-0.5 block text-[13.5px] text-ink-2">{f.text}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** The Chief Medical Officer section, as on the Apex MD site. */
function PhysicianSection() {
  return (
    <section className="border-t border-border bg-[#f7f6f4]">
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-4 py-16 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:px-9 md:py-20">
        <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[22px] shadow-[0_30px_60px_-30px_rgba(23,20,15,0.5)]">
          <img src={PHYSICIAN.photo} alt="Dr. Jim Bowen, Chief Medical Officer" className="block w-full" />
        </div>
        <div className="md:border-l md:border-border md:pl-10">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-[var(--apex-accent-bright)]">
            {PHYSICIAN.eyebrow}
          </p>
          <h2 className="mt-4 text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">
            {PHYSICIAN.title.lead}
            <br />
            <span className="text-[var(--apex-accent-bright)]">{PHYSICIAN.title.accent}</span>
          </h2>
          <p className="mt-6 max-w-[640px] text-[17px] font-semibold leading-[1.7] text-foreground">{PHYSICIAN.intro}</p>
          <ul className="mt-6 space-y-3.5">
            {PHYSICIAN.points.map((point) => (
              <li key={point} className="flex items-center gap-3.5 text-[16px] font-semibold text-foreground">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--apex-accent-bright)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** How the price is charged, in plain words: once, or the first of a schedule. */
function billingLine(product: PublicProduct): string {
  if (!product.recurring) return "One payment.";
  const every = (product.billingFrequency ?? "regular").toLowerCase();
  return product.repeatTimes
    ? `Billed ${every}, ${product.repeatTimes} payments in total. The first is taken today.`
    : `Billed ${every} until cancelled. The first payment is taken today.`;
}

/** Top of the checkout card: what is being bought and what it costs. */
function PriceHeader({ product }: { product: PublicProduct }) {
  return (
    <div className="border-b border-border pb-5">
      <p className="apex-eyebrow">You&apos;re purchasing</p>
      <h2 className="mt-1.5 text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-foreground">{product.name}</h2>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[40px] font-extrabold leading-none tracking-[-0.035em] text-foreground">
          {money(product.price, product.currency)}
        </span>
        {product.recurring && product.billingFrequency && (
          <span className="text-[14px] font-medium text-ink-2">/ {product.billingFrequency.toLowerCase()}</span>
        )}
      </p>
      <p className="mt-2 text-[12.5px] text-ink-2">
        {billingLine(product)} You&apos;ll answer a short form after paying.
      </p>
    </div>
  );
}

/** Step 3–4: the card form. Mounted inside <Elements> with the product's own Stripe key. */
function CardStep({
  purchase,
  onPaid,
  onRestart,
}: {
  purchase: SavedPurchase;
  onPaid: (p: CheckoutPayment | null) => void;
  onRestart: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // A pay whose answer never arrived may still have charged: ask before letting them pay again.
  const settleUnknown = async (): Promise<boolean> => {
    try {
      const s = await getCheckoutStatus(purchase.purchaseToken);
      if (s.paid) {
        onPaid(null);
        return true;
      }
    } catch {
      // Unknown either way; let them try again — paying twice for one purchase is safe.
    }
    return false;
  };

  const pay = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setBusy(true);
    setError(null);
    try {
      // A token works once, so a fresh one every attempt — including after a decline.
      const { token, error: tokenError } = await stripe.createToken(card);
      if (tokenError || !token) {
        setError(tokenError?.message ?? "Your card details could not be read.");
        return;
      }
      const payment = await payCheckout({ purchaseToken: purchase.purchaseToken, cardToken: token.id });
      if (payment.status === "paid") onPaid(payment);
      else setError(payment.failureReason || "The payment did not go through. Please try another card.");
    } catch (err) {
      const e = apiError(err);
      if (e.status === 402) setError(e.message || "Your card was declined. Please try another card.");
      else if (e.status === 404) setExpired(true);
      else if (e.status === 409 || e.status === undefined || e.status >= 500) {
        // In progress, timed out or lost: the charge may have happened.
        if (!(await settleUnknown())) {
          setError(
            e.status === 409
              ? "A payment for this purchase is already in progress. Please wait a moment and try again."
              : "We couldn't confirm your payment. Please try again — you won't be charged twice.",
          );
        }
      } else if (e.status === 429) setError("Too many attempts. Please wait a minute and try again.");
      else setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (expired) {
    return (
      <div className="space-y-4">
        <p className="text-[14px] text-ink-2">This checkout has expired. Please start again — it only takes a moment.</p>
        <button className={BUTTON} onClick={onRestart}>
          Start again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-ink-2">Card details</label>
        <div className="rounded-[10px] border border-border bg-card px-3 py-3.5 transition focus-within:border-[var(--apex-accent-bright)] focus-within:shadow-[0_0_0_3px_var(--apex-accent-soft)]">
          <CardElement
            options={{
              hidePostalCode: false,
              style: { base: { fontSize: "15px", fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif", color: "#17140f" } },
            }}
          />
        </div>
      </div>
      {error && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
      )}
      <button className={BUTTON} onClick={pay} disabled={busy || !stripe}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {busy ? "Processing…" : `Pay ${money(purchase.amount, purchase.currency)}`}
      </button>
      <p className="text-center text-[12px] text-ink-2">
        Paying as {purchase.email}.{" "}
        <button className="underline" onClick={onRestart} disabled={busy}>
          Not you?
        </button>
      </p>
    </div>
  );
}

export default function BuyPage() {
  const formKey = useMemo(formKeyFromPath, []);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loadError, setLoadError] = useState<"not_found" | "error" | null>(formKey ? null : "not_found");
  const [purchase, setPurchase] = useState<SavedPurchase | null>(() => (formKey ? readSaved(formKey) : null));
  const [paid, setPaid] = useState<{ payment: CheckoutPayment | null; email: string } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<{ text: string; login?: boolean } | null>(null);

  useEffect(() => {
    if (!formKey) return;
    getPublicProduct(formKey)
      .then(setProduct)
      .catch((err) => setLoadError(apiError(err).status === 404 ? "not_found" : "error"));
  }, [formKey]);

  const validDetails = firstName.trim() && lastName.trim() && /.+@.+\..+/.test(email.trim());

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const res = await startCheckout({
        formKey,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      const saved: SavedPurchase = { formKey, ...res, email: email.trim() };
      keepSaved(saved, formKey);
      setPurchase(saved);
    } catch (err) {
      const e = apiError(err);
      if (e.status === 409) setStartError({ text: e.message, login: true });
      else if (e.status === 404) setLoadError("not_found");
      else if (e.status === 429) setStartError({ text: "Too many attempts. Please wait a minute and try again." });
      else if (e.status === 503) setStartError({ text: "Payments aren't available right now. Please try again later." });
      else setStartError({ text: e.message });
    } finally {
      setStarting(false);
    }
  };

  const restart = () => {
    keepSaved(null, formKey);
    setPurchase(null);
  };

  const onPaid = (payment: CheckoutPayment | null) => {
    const who = purchase?.email ?? email;
    keepSaved(null, formKey);
    setPaid({ payment, email: who });
  };

  const stripePromise = useMemo(
    () => (product?.publishableKey ? stripeFor(product.publishableKey) : null),
    [product?.publishableKey],
  );

  const look = presentationFor(formKey);

  if (loadError === "not_found") {
    return (
      <BuyShell>
        <CenterCard>
          <Unavailable
            title="This product isn't available"
            text="Please check the link, or contact us if you think this is a mistake."
          />
        </CenterCard>
      </BuyShell>
    );
  }
  if (loadError === "error") {
    return (
      <BuyShell>
        <CenterCard>
          <Unavailable title="Something went wrong" text="We couldn't load this page. Please refresh and try again." />
        </CenterCard>
      </BuyShell>
    );
  }
  if (!product) {
    return (
      <BuyShell>
        <div className="flex justify-center py-32 text-[var(--mute)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </BuyShell>
    );
  }

  if (paid) {
    return (
      <BuyShell>
        <CenterCard>
          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--opt-soft)] text-[var(--opt)]">
                <CheckCircle2 className="w-9 h-9" />
              </span>
            </div>
            <div>
              <h1 className="text-[34px] font-extrabold leading-tight tracking-[-0.03em] text-foreground">
                Payment <em className="italic text-[var(--apex-accent-bright)]">received</em>
              </h1>
              {paid.payment && (
                <p className="mt-2 text-[14px] text-ink-2">
                  {money(paid.payment.amount, paid.payment.currency)}
                  {paid.payment.card ? ` · ${paid.payment.card.brand} ending ${paid.payment.card.last4}` : ""}
                </p>
              )}
            </div>
            <div className="flex gap-3 rounded-[14px] border border-border bg-background p-4 text-left">
              <MailCheck className="mt-0.5 w-5 h-5 shrink-0 text-[var(--apex-accent-bright)]" />
              <div className="text-[14px] text-ink-2">
                <p className="font-bold text-foreground">Check your email</p>
                <p className="mt-1">
                  We sent a link to <span className="font-semibold text-foreground">{paid.email}</span> to set your
                  password. Once you log in, your intake form opens automatically.
                </p>
              </div>
            </div>
            <a href="/login" className="inline-block text-[14px] font-semibold text-[var(--apex-accent-bright)] underline">
              Already set your password? Log in
            </a>
          </div>
        </CenterCard>
      </BuyShell>
    );
  }

  const steps = ["Your details", "Payment"];
  const checkout = !product.publishableKey ? (
    <Unavailable title="Not available right now" text="Purchases for this product are paused. Please check back later." />
  ) : (
    <>
      <ol className="my-5 flex items-center gap-2 text-[12.5px]">
        {steps.map((step, i) => {
          const active = (purchase ? 1 : 0) === i;
          const done = Boolean(purchase) && i === 0;
          return (
            <li key={step} className="flex items-center gap-2">
              <span
                className="grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] font-bold"
                style={
                  active
                    ? { background: "var(--apex-accent-bright)", color: "#fff" }
                    : done
                      ? { background: "var(--opt)", color: "#fff" }
                      : { background: "var(--surface-2)", color: "var(--ink-2)" }
                }
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={active ? "font-semibold text-foreground" : "text-ink-2"}>{step}</span>
              {i === 0 && <span className="mx-1 h-px w-6 bg-border" />}
            </li>
          );
        })}
      </ol>

      {!purchase ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className={INPUT} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} />
            <input className={INPUT} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
          </div>
          <input className={INPUT} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={INPUT} type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={32} />
          {startError && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {startError.text}{" "}
              {startError.login && (
                <a href="/login" className="font-semibold underline">
                  Log in
                </a>
              )}
            </div>
          )}
          <button className={BUTTON} onClick={start} disabled={!validDetails || starting}>
            {starting && <Loader2 className="w-4 h-4 animate-spin" />}
            Continue to payment →
          </button>
        </div>
      ) : (
        stripePromise && (
          <Elements stripe={stripePromise}>
            <CardStep purchase={purchase} onPaid={onPaid} onRestart={restart} />
          </Elements>
        )
      )}

      <div className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-4 text-[12px] text-ink-2">
        <ShieldCheck className="w-4 h-4 text-[var(--opt)]" /> Secure checkout · Card details go straight to Stripe
      </div>
    </>
  );

  return (
    <BuyShell>
      <section className="mx-auto grid max-w-[1240px] items-start gap-10 px-4 py-10 md:px-9 md:py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
        <ProductStory product={product} look={look} />
        <aside className="lg:sticky lg:top-24">
          <div className="apex-card p-6 shadow-[0_24px_60px_-30px_rgba(23,20,15,0.35)] md:p-7">
            <PriceHeader product={product} />
            {checkout}
          </div>
        </aside>
      </section>
      {look?.showPhysician && <PhysicianSection />}
    </BuyShell>
  );
}
