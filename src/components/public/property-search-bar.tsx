"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, MapPin, Home, TrendingUp, Clock, X } from "lucide-react";
import { usePropertySearchSuggestions } from "@/hooks/use-property-search";

interface SearchSuggestion {
  id: string;
  type: "location" | "property_type" | "price_range" | "recent";
  label: string;
  description?: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PropertySearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function PropertySearchBar({
  value,
  onSearch,
  placeholder = "Buscar imóveis...",
  className = "",
}: PropertySearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Use React Query hook for search suggestions
  const { data: apiSuggestions = [], isLoading } = usePropertySearchSuggestions(
    {
      query: debouncedQuery,
      enabled: debouncedQuery.length >= 2,
    }
  );

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ubigroup-recent-searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim() || query.length < 2) return;

    try {
      const updated = [
        query,
        ...recentSearches.filter((s) => s !== query),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("ubigroup-recent-searches", JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  // Get icon for suggestion type
  const getIconForType = (type: string) => {
    switch (type) {
      case "location":
        return MapPin;
      case "property_type":
        return Home;
      case "price_range":
        return TrendingUp;
      default:
        return Search;
    }
  };

  // Combine API suggestions with recent searches
  const getAllSuggestions = (): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];

    // Add recent searches when no query or short query
    if (debouncedQuery.length < 2 && recentSearches.length > 0) {
      const recent = recentSearches.map((search, index) => ({
        id: `recent-${index}`,
        type: "recent" as const,
        label: search,
        description: "Busca recente",
        icon: Clock,
      }));
      suggestions.push(...recent);
    }

    // Add API suggestions
    if (apiSuggestions.length > 0) {
      const converted = apiSuggestions.map((suggestion, index) => ({
        id: `api-${index}`,
        type: suggestion.type,
        label: suggestion.label,
        description: suggestion.category,
        icon: getIconForType(suggestion.type),
      }));
      suggestions.push(...converted);
    }

    return suggestions.slice(0, 8);
  };

  // Handle input changes with debounced API calls
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Update debounced query for API calls
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(newValue);
    }, 300);
  };

  // Handle search submission
  const handleSearch = (query?: string) => {
    const searchQuery = query || inputValue;
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    const searchQuery =
      suggestion.type === "recent" ? suggestion.label : suggestion.label;
    setInputValue(searchQuery);
    handleSearch(searchQuery);
  };

  // Handle input focus
  const handleFocus = () => {
    setShowSuggestions(true);
    // Set debounced query immediately on focus if there's input
    if (inputValue.length >= 2) {
      setDebouncedQuery(inputValue);
    }
  };

  // Handle clear
  const handleClear = () => {
    setInputValue("");
    onSearch("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    const IconComponent = suggestion.icon || Search;
    return <IconComponent className="h-4 w-4" />;
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case "location":
        return "Local";
      case "property_type":
        return "Tipo";
      case "price_range":
        return "Preço";
      case "recent":
        return "Recente";
      default:
        return "";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
                if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              className="pl-10 pr-20 h-12 text-base"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                onClick={() => handleSearch()}
                size="sm"
                className="h-8"
              >
                Buscar
              </Button>
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="rounded-lg border-none shadow-md">
            <CommandList className="max-h-80">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Buscando sugestões...
                </div>
              ) : getAllSuggestions().length === 0 ? (
                <CommandEmpty className="py-6 text-center text-sm">
                  {inputValue.trim()
                    ? "Nenhuma sugestão encontrada."
                    : "Digite para buscar imóveis..."}
                </CommandEmpty>
              ) : (
                <>
                  {recentSearches.length > 0 && !inputValue.trim() && (
                    <CommandGroup heading="Buscas Recentes">
                      {getAllSuggestions()
                        .filter((s) => s.type === "recent")
                        .map((suggestion) => (
                          <CommandItem
                            key={suggestion.id}
                            value={suggestion.label}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            className="flex items-center space-x-3 px-3 py-2 cursor-pointer"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                              {getSuggestionIcon(suggestion)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {suggestion.label}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getSuggestionTypeLabel(suggestion.type)}
                            </Badge>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

                  {getAllSuggestions().filter((s) => s.type !== "recent")
                    .length > 0 && (
                    <CommandGroup
                      heading={inputValue.trim() ? "Sugestões" : "Populares"}
                    >
                      {getAllSuggestions()
                        .filter((s) => s.type !== "recent")
                        .map((suggestion) => (
                          <CommandItem
                            key={suggestion.id}
                            value={suggestion.label}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            className="flex items-center space-x-3 px-3 py-2 cursor-pointer"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                              {getSuggestionIcon(suggestion)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                {suggestion.label}
                              </div>
                              {suggestion.description && (
                                <div className="text-sm text-muted-foreground">
                                  {suggestion.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {suggestion.count && (
                                <span className="text-xs text-muted-foreground">
                                  {suggestion.count}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {getSuggestionTypeLabel(suggestion.type)}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
