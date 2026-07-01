export function normalizeUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawUrl of urls || []) {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }

  return result;
}

export function shouldRetryTask(task: { attempts?: number; maxAttempts?: number }): boolean {
  const attempts = task.attempts || 0;
  const maxAttempts = task.maxAttempts ?? 3;
  return attempts < maxAttempts;
}
