"use client";

import { useQuery } from "@tanstack/react-query";

export interface SearchSuggestion {
  type: "location" | "property_type" | "price_range";
  value: string;
  label: string;
  category?: string;
}

interface SearchSuggestionsParams {
  query: string;
  enabled?: boolean;
}

export function usePropertySearchSuggestions({
  query,
  enabled = true,
}: SearchSuggestionsParams) {
  return useQuery({
    queryKey: ["property-search-suggestions", query],
    queryFn: async (): Promise<SearchSuggestion[]> => {
      if (!query || query.length < 2) {
        return [];
      }

      const params = new URLSearchParams();
      params.append("q", query);

      const response = await fetch(
        `/api/properties/search-suggestions?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch search suggestions");
      }

      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting property locations for filters
export function usePropertyLocations() {
  return useQuery({
    queryKey: ["property-locations"],
    queryFn: async () => {
      const response = await fetch("/api/properties/locations");
      if (!response.ok) {
        throw new Error("Failed to fetch property locations");
      }

      const data = await response.json();
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - locations don't change frequently
  });
}

// Hook for getting property statistics
export function usePropertyStats() {
  return useQuery({
    queryKey: ["property-stats"],
    queryFn: async () => {
      const response = await fetch("/api/properties/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch property statistics");
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
