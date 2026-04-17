import { inferPoiCategory, isLikelyHawkerCentre, toPoiCategory } from './poiLabels';

describe('isLikelyHawkerCentre', () => {
  it('matches hawker keywords', () => {
    expect(isLikelyHawkerCentre('Lau Pa Sat Hawker Centre')).toBe(true);
    expect(isLikelyHawkerCentre('Maxwell Food Centre')).toBe(true);
    expect(isLikelyHawkerCentre('Old Airport Kopitiam')).toBe(true);
    expect(isLikelyHawkerCentre('Merlion Park')).toBe(false);
  });
});

describe('inferPoiCategory', () => {
  it('returns hawkerCenter for hawker/food-centre names', () => {
    expect(inferPoiCategory('Lau Pa Sat Hawker Centre')).toBe('hawkerCenter');
    expect(inferPoiCategory('Maxwell Food Centre')).toBe('hawkerCenter');
  });

  it('returns historicSite for museum/fort/heritage names', () => {
    expect(inferPoiCategory('National Museum of Singapore')).toBe('historicSite');
    expect(inferPoiCategory('Fort Canning Park')).toBe('historicSite');
    expect(inferPoiCategory('Sri Mariamman Temple')).toBe('historicSite');
  });

  it('returns park for park/garden/nature names', () => {
    expect(inferPoiCategory('East Coast Park')).toBe('park');
    expect(inferPoiCategory('Botanic Gardens')).toBe('park');
    expect(inferPoiCategory('Sungei Buloh Wetland Reserve')).toBe('park');
  });

  it('returns touristAttraction for landmark names', () => {
    expect(inferPoiCategory('Merlion Park')).toBe('touristAttraction');
    expect(inferPoiCategory('Singapore Zoo')).toBe('touristAttraction');
    expect(inferPoiCategory('Marina Bay Sands SkyPark')).toBe('touristAttraction');
  });

  it('returns undefined for unrecognised names', () => {
    expect(inferPoiCategory('Some Random Place')).toBeUndefined();
  });
});

describe('toPoiCategory', () => {
  it('returns valid categories as-is', () => {
    expect(toPoiCategory('hawkerCenter')).toBe('hawkerCenter');
    expect(toPoiCategory('historicSite')).toBe('historicSite');
    expect(toPoiCategory('park')).toBe('park');
    expect(toPoiCategory('touristAttraction')).toBe('touristAttraction');
  });

  it('returns undefined for unrecognised strings', () => {
    expect(toPoiCategory('restaurant')).toBeUndefined();
    expect(toPoiCategory('')).toBeUndefined();
    expect(toPoiCategory(undefined)).toBeUndefined();
  });
});
