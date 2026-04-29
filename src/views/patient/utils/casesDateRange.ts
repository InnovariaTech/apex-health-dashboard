/**
 * Fixed date range used when fetching cases from the patient cases API.
 * Edit these two constants to change the window.
 */
export const CASES_DATE_RANGE_START = "2026-02-01T00:00:00.000Z";
export const CASES_DATE_RANGE_END = "2026-04-01T00:00:00.000Z";

export function getCasesDateRange() {
  return {
    startTime: CASES_DATE_RANGE_START,
    endTime: CASES_DATE_RANGE_END,
  };
}
