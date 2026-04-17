import type { PointOfInterestCategory } from '../../../../shared/types/index';

/** Heuristic: hawker centres often appear in POI names when the API does not send a category. */
export function isLikelyHawkerCentre(name: string): boolean {
  const n = name.toLowerCase();
  return (
    /\bhawker\b/.test(n) ||
    /\bfood\s*cent(?:re|er)\b/.test(n) ||
    /\bkopitiam\b/.test(n)
  );
}

/**
 * Infers a PointOfInterestCategory from a POI name.
 * Used as a fallback when the backend does not include a category field.
 * Returns undefined if no category can be inferred.
 */
export function inferPoiCategory(name: string): PointOfInterestCategory | undefined {
  if (isLikelyHawkerCentre(name)) return 'hawkerCenter';

  const n = name.toLowerCase();

  if (
    /\bmuseum\b/.test(n) ||
    /\bfort\b/.test(n) ||
    /\bheritage\b/.test(n) ||
    /\btemple\b/.test(n) ||
    /\bmosque\b/.test(n) ||
    /\bchurch\b/.test(n) ||
    /\bcathedral\b/.test(n) ||
    /\bmonument\b/.test(n) ||
    /\bmemorial\b/.test(n) ||
    /\bhistoric\b/.test(n)
  ) {
    return 'historicSite';
  }

  if (
    /\bzoo\b/.test(n) ||
    /\baquarium\b/.test(n) ||
    /\bskypark\b/.test(n) ||
    /\buniversal\b/.test(n) ||
    /\bmerlion\b/.test(n) ||
    /\bsafari\b/.test(n) ||
    /\btheme\s*park\b/.test(n)
  ) {
    return 'touristAttraction';
  }

  if (
    /\bpark\b/.test(n) ||
    /\bgardens?\b/.test(n) ||
    /\breserves?\b/.test(n) ||
    /\bnature\b/.test(n) ||
    /\bwetlands?\b/.test(n) ||
    /\bforests?\b/.test(n)
  ) {
    return 'park';
  }

  return undefined;
}

const VALID_POI_CATEGORIES = new Set<string>(['hawkerCenter', 'historicSite', 'park', 'touristAttraction']);

/**
 * Safely converts a raw backend string to PointOfInterestCategory.
 * Returns undefined if the string is not a recognised category.
 */
export function toPoiCategory(raw: string | undefined): PointOfInterestCategory | undefined {
  if (raw && VALID_POI_CATEGORIES.has(raw)) return raw as PointOfInterestCategory;
  return undefined;
}
