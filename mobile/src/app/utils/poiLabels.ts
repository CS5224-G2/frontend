/** Heuristic: hawker centres often appear in POI names when the API does not send a category. */
export function isLikelyHawkerCentre(name: string): boolean {
  const n = name.toLowerCase();
  return (
    /\bhawker\b/.test(n) ||
    /\bfood\s*centre\b/.test(n) ||
    /\bfood\s*center\b/.test(n) ||
    /\bkopitiam\b/.test(n)
  );
}
