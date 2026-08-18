// Single source of truth for financial value states. Brand colors and
// financial-state colors are two different systems: positive/negative/neutral
// describe a value's financial direction and always map to green/red/muted,
// never to the PolyScripts orange/coral/pink branding.

/**
 * "positive" | "negative" | "neutral"
 *
 *   value > 0   -> positive
 *   value < 0   -> negative
 *   otherwise   -> neutral (zero, missing, NaN)
 */
export function getValueState(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

/** "tone-positive" | "tone-negative" | "tone-neutral" ready for className. */
export function getToneClass(value) {
  return `tone-${getValueState(value)}`;
}