/**
 * Parse target languages from various input formats
 * Supports JSON arrays and comma-separated strings
 */
export function parseTargetLanguages(value: string | null): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.length === 0) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      // Fallback to comma parsing below
    }
  }

  return trimmed
    .split(',')
    .map((lang) => lang.trim())
    .filter((lang) => lang.length > 0);
}