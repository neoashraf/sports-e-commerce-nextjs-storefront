import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api/client";

/**
 * BD geo lookups for cascading address selects (FR-CART-044/045). Sourced from the **backend** geo
 * dataset — the same data the checkout zone-resolver matches against — so any (division → district →
 * area) the shopper picks is guaranteed to resolve to a delivery zone (no "unserviceable" on a real
 * selection). Public endpoints; long-lived (geography rarely changes).
 */

const stringList = z.array(z.string());
const areaList = z.array(z.object({ upazila: z.string(), delivery_zone: z.string().optional() }));

export function useDivisions() {
  return useQuery({
    queryKey: ["geo", "divisions"],
    queryFn: () => api.get("/geo/divisions", { schema: stringList, public: true }) as Promise<string[]>,
    staleTime: 60 * 60_000,
  });
}

export function useDistricts(division: string | null) {
  return useQuery({
    queryKey: ["geo", "districts", division],
    enabled: !!division,
    queryFn: () =>
      api.get("/geo/districts", {
        schema: stringList,
        params: { division: division ?? "" },
        public: true,
      }) as Promise<string[]>,
    staleTime: 60 * 60_000,
  });
}

export function useAreas(district: string | null) {
  return useQuery({
    queryKey: ["geo", "areas", district],
    enabled: !!district,
    queryFn: async () => {
      const rows = (await api.get("/geo/areas", {
        schema: areaList,
        params: { district: district ?? "" },
        public: true,
      })) as { upazila: string }[];
      return rows.map((r) => r.upazila);
    },
    staleTime: 60 * 60_000,
  });
}
