import { API_MODE } from "@/constants/api";
import { api as mockApi } from "@/mocks/in-memory/mockApi";

/**
 * Application API surface. UI imports this — never import mock stores directly.
 * To connect MERN: implement `createHttpApi` and return the same shape `{ auth, entities, integrations }`.
 */
function resolveApi() {
  if (API_MODE === "http") {
    throw new Error(
      "VITE_API_MODE=http requires an HTTP adapter. Implement src/api/http/createHttpApi.js and wire it in client.js."
    );
  }
  return mockApi;
}

export const api = resolveApi();
