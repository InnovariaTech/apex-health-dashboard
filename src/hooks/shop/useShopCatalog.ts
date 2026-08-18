import { useQuery } from "@tanstack/react-query";
import { getShopCatalog } from "@/api/http/shop";
import { queryKeys } from "@/hooks/queryKeys";
import type { ShopTab } from "@/types/shop/liveCatalog_types";

/**
 * The patient storefront catalog. The whole store arrives in one request, so
 * a generous staleTime avoids refetching as the user flips tabs.
 *
 * An empty `tabs` array is a valid, non-error state ("nothing published yet"),
 * so the Shop page distinguishes `data.length === 0` from `isError`.
 */
export function useShopCatalog() {
  return useQuery<ShopTab[]>({
    queryKey: queryKeys.shop.catalog(),
    queryFn: () => getShopCatalog(),
    staleTime: 5 * 60 * 1000,
  });
}
