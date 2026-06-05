/**
 * Trainerize lookup & provisioning — `/api/trainerize/org/*`, `/users/lookup`,
 * `/me/add-user`, `/me/attach`, `/me/trainer-assignment`.
 * See `docs/trainerize/lookup-and-provisioning-apis.md`.
 *
 * Note: `me/add-user` self-provisions the authenticated user — name/email/DOB
 * are pulled from the Apex profile by the backend.
 */

/** `GET /trainerize/org/group-id`. */
export interface OrgGroupId {
  groupId: string | null;
}

/** `GET /trainerize/users/lookup` — entry shape. */
export interface TrainerizeUserLookup {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  type?: "client" | "trainer" | string;
  status?: string;
  role?: string;
  profileName?: string;
  trainerID?: number;
  latestSignedIn?: string;
  profileIconUrl?: string;
  profileIconVersion?: number;
  trialStatus?: string;
  [key: string]: unknown;
}

export interface LookupUsersParams {
  /** at least one of `email` / `text` is required */
  email?: string;
  text?: string;
  start?: number;
  count?: number;
  /** default "recipient" */
  view?: string;
}

/** `POST /me/add-user` — discriminated by `type`. */
export type AddUserPayload =
  | { type: "client"; trainerUserId?: number }
  | { type: "trainer"; role?: string; locationId?: number };

export interface AddUserResult {
  trainerizeUserId: number;
}

/** `POST /me/attach` — link existing Trainerize account. */
export interface AttachUserPayload {
  trainerizeUserId: number;
  trainerUserId?: number | null;
}

/** `POST /me/trainer-assignment`. */
export interface TrainerAssignmentPayload {
  trainerUserId: number;
}
