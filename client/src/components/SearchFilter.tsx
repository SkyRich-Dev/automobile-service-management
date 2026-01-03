import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

export interface SearchFilterProps {
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onSearch: (searchTerm: string) => void;
  onFilterChange: (filters: Record<string, string>) => void;
  className?: string;
  showFilterButton?: boolean;
  debounceMs?: number;
}

export function SearchFilter({
  searchPlaceholder,
  filters = [],
  onSearch,
  onFilterChange,
  className,
  showFilterButton = true,
  debounceMs = 300,
}: SearchFilterProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const debouncedSearch = useCallback(
    (value: string) => {
      const timer = setTimeout(() => {
        onSearch(value);
      }, debounceMs);
      return () => clearTimeout(timer);
    },
    [onSearch, debounceMs]
  );

  useEffect(() => {
    const cleanup = debouncedSearch(searchTerm);
    return cleanup;
  }, [searchTerm, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value };
    if (value === "all" || value === "") {
      delete newFilters[key];
    }
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilterValues({});
    onFilterChange({});
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch("");
  };

  const activeFilterCount = Object.keys(filterValues).length;
  const hasActiveFilters = activeFilterCount > 0 || searchTerm.length > 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder || t('common.search', 'Search...')}
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-9 pr-8"
          data-testid="input-search"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
            onClick={clearSearch}
            data-testid="button-clear-search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {filters.length > 0 && showFilterButton && (
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              data-testid="button-filter"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('common.filters', 'Filters')}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t('common.filters', 'Filters')}</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto px-2 py-1 text-xs"
                    data-testid="button-clear-filters"
                  >
                    {t('common.clearAll', 'Clear all')}
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-1.5">
                    <label className="text-sm text-muted-foreground">
                      {filter.label}
                    </label>
                    <Select
                      value={filterValues[filter.key] || "all"}
                      onValueChange={(value) => handleFilterChange(filter.key, value)}
                    >
                      <SelectTrigger data-testid={`select-filter-${filter.key}`}>
                        <SelectValue placeholder={filter.placeholder || t('common.all', 'All')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {!showFilterButton && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={filterValues[filter.key] || "all"}
              onValueChange={(value) => handleFilterChange(filter.key, value)}
            >
              <SelectTrigger className="w-[150px]" data-testid={`select-filter-${filter.key}`}>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', 'All')} {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearSearch();
            clearFilters();
          }}
          className="gap-1 text-muted-foreground"
          data-testid="button-clear-all"
        >
          <X className="h-3 w-3" />
          {t('common.clearAll', 'Clear all')}
        </Button>
      )}
    </div>
  );
}

export function useSearchFilter<T>(
  data: T[] | undefined,
  searchFields: (keyof T)[],
  filterFields?: Record<string, keyof T>
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredData = data?.filter((item) => {
    const matchesSearch = searchTerm === "" || searchFields.some((field) => {
      const value = item[field];
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      if (typeof value === "number") {
        return value.toString().includes(searchTerm);
      }
      return false;
    });

    const matchesFilters = Object.entries(filters).every(([filterKey, filterValue]) => {
      if (!filterValue || filterValue === "all") return true;
      const fieldKey = filterFields?.[filterKey];
      if (!fieldKey) return true;
      const itemValue = item[fieldKey];
      return itemValue === filterValue || String(itemValue) === filterValue;
    });

    return matchesSearch && matchesFilters;
  });

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredData: filteredData || [],
  };
}
