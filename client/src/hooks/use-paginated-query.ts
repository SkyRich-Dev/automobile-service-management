import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function usePaginatedQuery<T = any>(
  queryKey: string[],
  url: string,
  pageSize = 20,
  extraParams: Record<string, string> = {}
) {
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ...extraParams,
  });
  const paginatedUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;

  const query = useQuery<PaginatedResponse<T>>({
    queryKey: [...queryKey, page, pageSize, ...Object.entries(extraParams).sort(([a],[b]) => a.localeCompare(b)).flat()],
    queryFn: async () => {
      const res = await fetch(paginatedUrl, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
      }
      return res.json();
    },
  });

  const totalPages = query.data ? Math.ceil(query.data.count / pageSize) : 0;

  return {
    ...query,
    page,
    setPage,
    results: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    totalPages,
    hasNextPage: !!query.data?.next,
    hasPreviousPage: !!query.data?.previous,
  };
}
