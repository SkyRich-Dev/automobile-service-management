export function unwrapPaginatedResponse<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'results' in data) return data.results;
  return [];
}

export async function fetchList<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return unwrapPaginatedResponse<T>(data);
}
