import { API_MODE } from "@/constants/api";
import { api as mockApi } from "@/mocks/in-memory/mockApi";
import { createHttpApi } from "@/api/http/createHttpApi";
import type { AppApi } from "@/api/types";

/**
 * Application API surface. UI imports this — never import mock stores directly.
 * To connect MERN: implement `createHttpApi` and return the same shape `{ auth, entities, integrations }`.
 */
function resolveApi(): AppApi {
  if (API_MODE === "http") {
    return createHttpApi();
  }
  return mockApi as unknown as AppApi;
}

export const api = resolveApi();
