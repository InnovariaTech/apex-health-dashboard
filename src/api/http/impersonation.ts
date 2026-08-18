import { axiosService } from "./axiosInstance";
import type { AuthUser } from "@/types/auth_types";

/**
 * Admin impersonation exchange/end.
 *   POST /api/auth/impersonation/exchange  { code }  → sets read-only cookie
 *   POST /api/auth/impersonation/end                  → clears it
 * The exchange needs no auth — the one-time code is the credential.
 */

const BASE = "/api/auth/impersonation";

export interface ExchangeResult {
  user: AuthUser | null;
  readOnly: boolean;
  expiresInSeconds: number;
}

function mapUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.email !== "string") return null;
  return {
    email: u.email,
    ...(typeof u.id === "string" || typeof u.id === "number" ? { id: u.id } : {}),
    ...(typeof u.role === "string" ? { role: u.role } : {}),
    ...(typeof u.isVerified === "boolean" ? { isVerified: u.isVerified } : {}),
    ...(typeof u.isActive === "boolean" ? { isActive: u.isActive } : {}),
    ...(typeof u.createdAt === "string" ? { createdAt: u.createdAt } : {}),
  };
}

export async function exchangeImpersonation(code: string): Promise<ExchangeResult> {
  const res = await axiosService.post(`${BASE}/exchange`, { code });
  const body = (res.data ?? {}) as Record<string, unknown>;
  // Tolerate both the enveloped and bare shapes.
  const payload = (body.data && typeof body.data === "object" ? body.data : body) as Record<string, unknown>;
  return {
    user: mapUser(payload.user),
    readOnly: payload.readOnly !== false,
    expiresInSeconds: typeof payload.expiresInSeconds === "number" ? payload.expiresInSeconds : 1800,
  };
}

export async function endImpersonation(): Promise<void> {
  await axiosService.post(`${BASE}/end`, {});
}
