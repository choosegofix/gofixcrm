/**
 * Human-friendly sequential-looking record numbers (e.g. "J-1001").
 * Not strictly gap-free under concurrent writes, which is fine for a
 * small multi-crew team — uniqueness is still enforced by the DB column.
 */
export function formatRecordNumber(prefix: string, existingCount: number) {
  return `${prefix}-${1000 + existingCount + 1}`;
}
