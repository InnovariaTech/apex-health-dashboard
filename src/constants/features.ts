/**
 * Feature switches for integrations that are being retired or rolled out.
 *
 * CAREVALIDATE_ENABLED — the legacy CareValidate surfaces: My Cases, case chat, the CareValidate
 * treatment catalogue and billing. Patients created since the move to Healthie have no
 * CareValidate account, so these fail for them. Off by default: the screens are disconnected —
 * their hooks don't fetch, they're hidden from the menu, and their pages show a "moved" notice —
 * but none of the code is removed. Set `VITE_CAREVALIDATE_ENABLED=true` to bring them back.
 *
 * Profile, documents and files are NOT behind this switch: the same endpoints are now served from
 * Healthie by the backend.
 */
export const CAREVALIDATE_ENABLED = import.meta.env.VITE_CAREVALIDATE_ENABLED === "true";
