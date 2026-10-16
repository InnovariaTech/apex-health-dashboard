import { FormFrame } from "@/shared/form-renderer";
import type { ResolvedTheme } from "@/types/intake/theme_types";

/**
 * The frame every intake screen sits in — the shared `FormFrame`: the themed page, the header (the
 * partner's logo when the theme has one, else Apex's; the organization's header button; the form
 * title), the form box, and the Back / Next area wherever the theme puts it. Without a theme (the
 * public start page, or before the manifest loads) it wears the Apex look. See
 * `Documents/Intake-Form/Branding and partner onboarding/branding/rendering-the-theme.md`.
 */
export default function IntakeShell({
  theme,
  title,
  children,
}: {
  theme?: ResolvedTheme | null;
  /** The form's title from the manifest. */
  title?: string | null;
  children: React.ReactNode;
}) {
  return (
    <FormFrame values={theme?.values} logoUrl={theme?.logoUrl || "/images/apex-md-logo.png"} title={title}>
      {children}
    </FormFrame>
  );
}
