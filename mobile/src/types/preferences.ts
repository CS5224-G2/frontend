/**
 * User preferences and cyclist type — align with backend and onboarding form.
 */

export type CyclistType = 'recreational' | 'commuter' | 'fitness';

export type RoutePreferences = {
  shade: number;   // 0–1 weight
  weather: number;
  difficulty: number;
  cultural: number;
};

export type OnboardingData = {
  cyclistType: CyclistType;
  preferences: RoutePreferences;
};
