import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-side recent searches (search-filter-fe). localStorage only — no server
 * entity, no FR; private/incognito simply stays empty. Capped at the most
 * recent N, deduped, most-recent-first.
 */
const MAX_RECENT = 8;

interface RecentSearchState {
  recent: string[];
  add: (query: string) => void;
  clear: () => void;
}

export const useRecentSearches = create<RecentSearchState>()(
  persist(
    (set) => ({
      recent: [],
      add: (query) => {
        const q = query.trim();
        if (q.length < 2) return;
        set((s) => ({
          recent: [q, ...s.recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT),
        }));
      },
      clear: () => set({ recent: [] }),
    }),
    { name: "storefront-recent-searches" },
  ),
);
