import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "./api";
import type { Features } from "@shared/features";

export async function fetchFeatures(): Promise<Features> {
  const res = await fetch(`${API_BASE_URL}/features`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to load features: ${res.status}`);
  }
  return (await res.json()) as Features;
}

export function useFeatures() {
  return useQuery<Features>({
    queryKey: [API_BASE_URL, "features"],
    queryFn: fetchFeatures,
    staleTime: 5 * 60 * 1000,
  });
}
