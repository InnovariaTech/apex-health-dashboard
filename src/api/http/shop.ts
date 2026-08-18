import { axiosService } from "./axiosInstance";
import type { ShopTab, ShopCatalogData } from "@/types/shop/liveCatalog_types";

/**
 * Patient shop read. One endpoint returns the whole visible catalog as a
 * nested tab → section → product tree, already in render order.
 * See `docs/shop/patient-catalog.md`.
 *
 * Cookie auth (`apex_access_token`); the axios instance sends credentials.
 * `data.tabs` may legitimately be empty — that's a normal 200 meaning
 * "nothing is published yet", NOT an error. Callers render an empty state.
 */

const SHOP_BASE = "/api/shop";

export async function getShopCatalog(): Promise<ShopTab[]> {
  const res = await axiosService.get<{ data?: ShopCatalogData } | ShopCatalogData>(
    `${SHOP_BASE}/catalog`,
  );
  // Tolerate either the `{ success, data }` envelope or a bare payload.
  const body = res.data as { data?: ShopCatalogData } & Partial<ShopCatalogData>;
  const payload = (body?.data ?? body) as ShopCatalogData | undefined;
  return Array.isArray(payload?.tabs) ? payload.tabs : [];
}
