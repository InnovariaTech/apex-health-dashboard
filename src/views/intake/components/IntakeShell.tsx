import { ThemeScope } from "@/components/theme/ThemeScope";
import type { ResolvedTheme } from "@/types/intake/theme_types";

/**
 * The frame every intake screen sits in: the themed page (`.apx-page`), the form card
 * (`.apx-container`) and its header — the partner's logo when the theme has one, else Apex's, and
 * the form title. Without a theme (the public start page, or before the manifest loads) it wears
 * the Apex look. See `Documents/Intake-Form/Branding and partner onboarding/branding/rendering-the-theme.md`.
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
    <ThemeScope values={theme?.values} className="min-h-screen px-4 py-8 sm:py-12">
      <div className="apx-container">
        <div className="apx-header">
          <img className="apx-logo" src={theme?.logoUrl || "/images/apex-md-logo.png"} alt="" />
          {title && <h1 className="apx-title">{title}</h1>}
        </div>
        {children}
      </div>
    </ThemeScope>
  );
}
