export function branchQueryUrl(baseUrl: string, branchId?: string, extraParams?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (branchId && branchId !== 'all') {
    if (baseUrl.includes('branch_id')) {
      // already has branch_id param pattern
    } else {
      params.set('branch', branchId);
    }
  }
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
  }
  const qs = params.toString();
  if (!qs) return baseUrl;
  return baseUrl.includes('?') ? `${baseUrl}&${qs}` : `${baseUrl}?${qs}`;
}

export function branchKey(baseKey: string | string[], branchId?: string): (string | undefined)[] {
  const keys = Array.isArray(baseKey) ? baseKey : [baseKey];
  return [...keys, branchId];
}
