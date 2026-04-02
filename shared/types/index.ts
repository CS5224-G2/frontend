// =============================================================================
// SHARED CANONICAL TYPES — CycleLink
// Single source of truth for all data shapes consumed by mobile and web-app.
// Both the Adapter layer AND the Mock layer must conform to these interfaces.
// =============================================================================

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type UserRole = 'user' | 'admin' | 'business';

export type LoginFormValues = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  onboardingComplete: boolean;
  role: UserRole;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export type CyclingPreference = 'Leisure' | 'Commuter' | 'Performance';

export type UserProfile = {
  userId: string;
  fullName: string;
  email: string;
  location: string;
  memberSince: string;
  cyclingPreference: CyclingPreference;
  weeklyGoalKm: number;
  bio: string;
  avatarUrl: string | null;
  avatarColor: string;
  stats: {
    totalRides: number;
    totalDistanceKm: number;
    favoriteTrails: number;
  };
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type PasswordUpdateResult = {
  status: 'ok';
  message: string;
  updatedAt: string;
};

export type PrivacySecuritySettings = {
  noThirdPartyAds: boolean;
  noDataImprovement: boolean;
  notificationsManagedInDeviceSettings: boolean;
};

// ---------------------------------------------------------------------------
// Routes (Mobile)
// ---------------------------------------------------------------------------

export type CyclistType = 'recreational' | 'commuter' | 'fitness' | 'general';

export type ShadePreference = 'reduce-shade' | 'dont-care';

export type ElevationPreference = 'lower' | 'dont-care' | 'higher';

export type AirQualityPreference = 'care' | 'dont-care';

export type PointOfInterestCategory =
  | 'hawkerCenter'
  | 'historicSite'
  | 'park'
  | 'touristAttraction';

export type PointOfInterestPreferences = Record<PointOfInterestCategory, boolean>;

export type UserPreferences = {
  cyclistType: CyclistType;
  preferredShade: number;   // legacy backend field derived from shadePreference
  elevation: number;        // legacy backend field derived from elevationPreference
  distance: number;         // legacy backend field derived from maxDistanceKm
  airQuality: number;       // legacy backend field derived from airQualityPreference
  shadePreference: ShadePreference;
  elevationPreference: ElevationPreference;
  maxDistanceKm: number;
  airQualityPreference: AirQualityPreference;
  pointsOfInterest: PointOfInterestPreferences;
};

export type Checkpoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
};

export type RouteRequestLocationSource = 'search' | 'map' | 'current-location';

export type RouteRequestLocation = {
  name: string;
  lat: number;
  lng: number;
  source: RouteRequestLocationSource;
};

export type Route = {
  id: string;
  name: string;
  description: string;
  distance: number;         // km
  elevation: number | 'higher' | 'lower' | 'dont-care';  // meters or preference string
  estimatedTime: number;    // minutes
  rating: number;
  reviewCount: number;
  startPoint: { lat: number; lng: number; name: string };
  endPoint: { lat: number; lng: number; name: string };
  checkpoints: Checkpoint[];
  routePath?: Array<{ lat: number; lng: number }>;
  cyclistType: CyclistType;
  shade: number | 'reduce-shade' | 'dont-care';  // 0–100 or preference string
  airQuality: number | 'care' | 'dont-care';     // 0–100 or preference string
  pointsOfInterestVisited?: Array<{ name: string; description?: string; lat?: number; lng?: number }>;
};

export type RouteRecommendationRequest = {
  startPoint: RouteRequestLocation;
  endPoint: RouteRequestLocation;
  checkpoints: Array<RouteRequestLocation & { id: string; description?: string }>;
  preferences: UserPreferences;
};

export type RouteFeedbackPayload = {
  routeId: string;
  rating: number;           // 1–5
  review: string;
};

// ---------------------------------------------------------------------------
// Ride History (Mobile)
// ---------------------------------------------------------------------------

export type RideHistory = {
  id: string;
  routeId: string;
  routeName: string;
  completionDate: string;
  completionTime: string;
  startTime?: string;
  endTime?: string;
  totalTime: number;        // minutes
  distance: number;         // km
  avgSpeed: number;         // km/h
  checkpoints: number;
  userRating?: number;
  userReview?: string;
  visitedCheckpoints?: Checkpoint[];
  pointsOfInterestVisited?: Array<{
    name: string;
    description?: string;
    lat?: number;
    lng?: number;
  }>;
  routeDetails?: Route;
};

export type GraphPeriod = 'week' | 'month';

export type GraphDataPoint =
  | { id: string; day: string; distance: number }   // weekly
  | { id: string; week: string; distance: number };  // monthly

// ---------------------------------------------------------------------------
// Admin Dashboard (Web)
// ---------------------------------------------------------------------------

export type AdminStats = {
  totalRides: number;
  activeUsers: number;
  revenueFormatted: string;
  openReports: number;
};

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  joinedFormatted: string;
};

// ---------------------------------------------------------------------------
// Business Dashboard (Web)
// ---------------------------------------------------------------------------

export type BusinessStats = {
  activeSponsors: number;
  dataPoints: string;
  totalSpentFormatted: string;
  userReach: string;
};

export type BusinessLandingStats = {
  monthlyUsers: number;
  monthlyRouteRequests: number;
  activePartners: number;
};

export type SponsoredLocation = {
  id: string;
  venue: string;
  location: string;
  views: string;
  clicks: string;
  status: 'Live' | 'Pending';
};
