// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import type { IdentityThemeField as IdentityField } from "../types";
import type { LayoutNode } from "./layout";

/**
 * The patient details flow over several pages (Documents/hidden-details-pages-titles.md §2): which
 * fields each page asks for, its title and its optional layout. Collected in the browser; only the
 * last page calls `/start`, once, with every field.
 */

export interface DetailsPage {
  /** /^[a-z][a-z0-9_]{0,39}$/, unique among the pages. */
  id: string;
  /** The inputs this page shows, in this order. */
  fields: IdentityField[];
  /** Drawn like a step title. */
  title?: string;
  /** Holds exactly one `detailsForm`, where `fields` go; absent, a plain page of `fields`. */
  tree?: LayoutNode;
}

/** The order the plain single page has always used. */
export const ALL_DETAILS_FIELDS: IdentityField[] = ["firstName", "lastName", "dob", "email", "phone"];

/** `detailsPages: null` (or none): today's single plain page of all five fields. */
export function detailsPagesOrDefault(pages: DetailsPage[] | null | undefined): DetailsPage[] {
  return pages && pages.length > 0 ? pages : [{ id: "details", fields: ALL_DETAILS_FIELDS }];
}

/** The title of the next page whose title differs from page `i`'s — the "Next: <title>" label. */
export function nextDetailsTitle(pages: DetailsPage[], i: number): string | undefined {
  const own = pages[i]?.title;
  for (let j = i + 1; j < pages.length; j++) {
    const t = pages[j]!.title;
    if (t && t !== own) return t;
  }
  return undefined;
}
