/**
 * HTTP adapter implementation.
 * Auth uses backend cookie-session routes (`/api/auth/*`).
 * Other entities currently fall back to in-memory stores until HTTP repositories are added.
 */
import { createAuthApi } from "./auth";
import { api as mockApi } from "@/mocks/in-memory/mockApi";
import type { AppApi } from "@/api/types";

export function createHttpApi(): AppApi {
  return {
    auth: createAuthApi(),
    entities: mockApi.entities,
    integrations: mockApi.integrations,
  };
}
