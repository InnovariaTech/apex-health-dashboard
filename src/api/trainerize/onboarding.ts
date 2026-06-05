import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, unwrapArray, type Envelope } from "./_envelope";
import type {
  OrgGroupId,
  TrainerizeUserLookup,
  LookupUsersParams,
  AddUserPayload,
  AddUserResult,
  AttachUserPayload,
  TrainerAssignmentPayload,
} from "@/types/trainerize/onboarding_types";

/**
 * Trainerize lookup & provisioning.
 * See `docs/trainerize/lookup-and-provisioning-apis.md`.
 *
 * Caveat: `me/add-user` self-provisions the authenticated user — name, email,
 * and DOB are pulled from the Apex profile. It is not a way to create an
 * account on behalf of someone else.
 */

const BASE = "/api/trainerize";

export async function getOrgGroupId(): Promise<OrgGroupId> {
  const res = await axiosService.get<Envelope<OrgGroupId>>(
    `${BASE}/org/group-id`,
  );
  return unwrap<OrgGroupId>(res.data);
}

export async function lookupUsers(
  params: LookupUsersParams,
): Promise<TrainerizeUserLookup[]> {
  const res = await axiosService.get<Envelope<TrainerizeUserLookup[]>>(
    `${BASE}/users/lookup`,
    { params },
  );
  return unwrapArray<TrainerizeUserLookup>(res.data);
}

export async function addUser(payload: AddUserPayload): Promise<AddUserResult> {
  const res = await axiosService.post<Envelope<AddUserResult>>(
    `${BASE}/me/add-user`,
    payload,
  );
  return unwrap<AddUserResult>(res.data);
}

export async function attachUser(payload: AttachUserPayload): Promise<void> {
  await axiosService.post<Envelope<null>>(`${BASE}/me/attach`, payload);
}

export async function assignTrainer(
  payload: TrainerAssignmentPayload,
): Promise<void> {
  await axiosService.post<Envelope<null>>(
    `${BASE}/me/trainer-assignment`,
    payload,
  );
}
