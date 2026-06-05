import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  CardioSession,
  CreateCardioPayload,
  GetCardioParams,
  UpdateCardioPayload,
} from "@/types/trainerize/cardio_types";

/**
 * Trainerize daily cardio sessions.
 * See `docs/trainerize/client-apis.md` Phase 4 (Daily Cardio).
 *
 * POST returns an `id` — persist as `dailyCardioId` for subsequent GET/PUT.
 */

const BASE = "/api/trainerize/me/daily-cardio";

export async function createCardio(
  payload: CreateCardioPayload,
): Promise<CardioSession> {
  const res = await axiosService.post<Envelope<CardioSession>>(BASE, payload);
  return unwrap<CardioSession>(res.data);
}

export async function getCardio(
  params: GetCardioParams,
): Promise<CardioSession> {
  const res = await axiosService.get<Envelope<CardioSession>>(BASE, {
    params,
  });
  return unwrap<CardioSession>(res.data);
}

export async function updateCardio(
  payload: UpdateCardioPayload,
): Promise<CardioSession> {
  const res = await axiosService.put<Envelope<CardioSession>>(BASE, payload);
  return unwrap<CardioSession>(res.data);
}
