/**
 * Computes the p-th percentile of an array of numbers.
 * Uses the "nearest rank" method. Does not mutate the input.
 * @param {number[]} values
 * @param {number} p - percentile (0–100)
 * @returns {number|null} rounded result, or null if values is empty
 */
export function computePercentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, idx)]);
}
