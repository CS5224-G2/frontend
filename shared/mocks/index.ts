// =============================================================================
// SHARED MOCK DATA — CycleLink
// Centralised mock data for both mobile and web-app adapters.
// Import from here in your service files when MOCK mode is enabled.
// =============================================================================

import type {
  AuthUser,
  AuthResult,
  UserProfile,
  PasswordUpdateResult,
  PrivacySecuritySettings,
  Route,
  RideHistory,
  GraphDataPoint,
  AdminStats,
  AdminUser,
  BusinessLandingStats,
  BusinessStats,
  SponsoredLocation,
} from '../types/index';

// ---------------------------------------------------------------------------
// Auth Mocks
// ---------------------------------------------------------------------------

export const mockAuthUser: AuthUser = {
  id: 'user_001',
  firstName: 'Alex',
  lastName: 'Rider',
  fullName: 'Alex Rider',
  email: 'alex@example.com',
  onboardingComplete: true,
  role: 'user',
};

export const mockAdminUser: AuthUser = {
  id: 'admin_001',
  firstName: 'Admin',
  lastName: 'User',
  fullName: 'Admin User',
  email: 'admin@cyclink.com',
  onboardingComplete: true,
  role: 'admin',
};

export const mockBusinessUser: AuthUser = {
  id: 'biz_001',
  firstName: 'Business',
  lastName: 'Partner',
  fullName: 'Business Partner',
  email: 'business@cyclink.com',
  onboardingComplete: true,
  role: 'business',
};

export const mockAuthResult: AuthResult = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  user: mockAuthUser,
};

/** Returns a mock AuthResult appropriate for the given email. */
export function getMockAuthResult(email: string): AuthResult {
  const normalised = email.trim().toLowerCase();
  if (normalised === 'admin@cyclink.com') {
    return { ...mockAuthResult, user: mockAdminUser };
  }
  if (normalised === 'business@cyclink.com') {
    return { ...mockAuthResult, user: mockBusinessUser };
  }
  return { ...mockAuthResult, user: { ...mockAuthUser, email: normalised } };
}

// ---------------------------------------------------------------------------
// User Profile Mocks
// ---------------------------------------------------------------------------

export const mockProfileAvatarUrl = 'mock://profile-avatar';

export let mockUserProfile: UserProfile = {
  userId: 'rider_1024',
  fullName: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  location: 'San Francisco, CA',
  memberSince: 'January 2025',
  cyclingPreference: 'Leisure',
  weeklyGoalKm: 80,
  bio: 'Weekend rider focused on scenic waterfront routes, coffee stops, and low-stress climbs.',
  avatarUrl: mockProfileAvatarUrl,
  avatarColor: '#1D4ED8',
  stats: {
    totalRides: 47,
    totalDistanceKm: 385.6,
    favoriteTrails: 28,
  },
};

// ---------------------------------------------------------------------------
// Privacy / Security Mocks
// ---------------------------------------------------------------------------

export let mockPrivacySettings: PrivacySecuritySettings = {
  noThirdPartyAds: false,
  noDataImprovement: false,
  notificationsManagedInDeviceSettings: true,
};

export let mockStoredPassword = 'CycleLink123';

export const mockPasswordUpdateResult: PasswordUpdateResult = {
  status: 'ok',
  message: 'Password updated successfully.',
  updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Routes Mocks
// ---------------------------------------------------------------------------

export const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Riverside Park Loop',
    description: 'A scenic route along the river with plenty of shade and flat terrain',
    distance: 12.5,
    elevation: 45,
    estimatedTime: 45,
    rating: 4.8,
    reviewCount: 234,
    startPoint: { lat: 40.7829, lng: -73.9654, name: 'Central Park South' },
    endPoint: { lat: 40.7829, lng: -73.9654, name: 'Central Park South' },
    checkpoints: [
      { id: 'cp1', name: 'Boathouse Cafe', lat: 40.7738, lng: -73.9686, description: 'Great place for a quick break' },
      { id: 'cp2', name: 'Bethesda Fountain', lat: 40.7734, lng: -73.9714, description: 'Beautiful fountain and photo spot' },
      { id: 'cp3', name: 'Belvedere Castle', lat: 40.7794, lng: -73.9692, description: 'Scenic viewpoint' },
    ],
    routePath: [
      { lat: 40.7829, lng: -73.9654 },
      { lat: 40.7794, lng: -73.9692 },
      { lat: 40.7738, lng: -73.9686 },
      { lat: 40.7734, lng: -73.9714 },
      { lat: 40.7829, lng: -73.9654 },
    ],
    cyclistType: 'recreational',
    shade: 80,
    airQuality: 85,
    pointsOfInterestVisited: [
      { name: 'Riverside Lookout Deck', description: 'Open river overlook with skyline views.', lat: 40.7762, lng: -73.9702 },
      { name: 'Cherry Grove Path', description: 'Tree-lined stretch that is especially scenic in spring.', lat: 40.7808, lng: -73.9671 },
    ],
  },
  {
    id: '2',
    name: 'City Commuter Express',
    description: 'Fast and efficient route through main bike lanes',
    distance: 8.3,
    elevation: 25,
    estimatedTime: 25,
    rating: 4.5,
    reviewCount: 567,
    startPoint: { lat: 40.7580, lng: -73.9855, name: 'Times Square' },
    endPoint: { lat: 40.7489, lng: -73.9680, name: 'Grand Central Terminal' },
    checkpoints: [
      { id: 'cp4', name: 'Bryant Park', lat: 40.7536, lng: -73.9832, description: 'Mid-route rest area' },
      { id: 'cp5', name: 'Public Library', lat: 40.7532, lng: -73.9822, description: 'Landmark checkpoint' },
    ],
    routePath: [
      { lat: 40.7580, lng: -73.9855 },
      { lat: 40.7536, lng: -73.9832 },
      { lat: 40.7532, lng: -73.9822 },
      { lat: 40.7489, lng: -73.9680 },
    ],
    cyclistType: 'commuter',
    shade: 40,
    airQuality: 70,
    pointsOfInterestVisited: [
      { name: 'Midtown Mural Corridor', description: 'Colorful street-art block along the commuter lane.', lat: 40.7516, lng: -73.9787 },
    ],
  },
  {
    id: '3',
    name: 'Hill Challenge Trail',
    description: 'Intensive climbing route for fitness enthusiasts',
    distance: 18.7,
    elevation: 320,
    estimatedTime: 75,
    rating: 4.9,
    reviewCount: 189,
    startPoint: { lat: 40.8448, lng: -73.9386, name: 'Fort Tryon Park' },
    endPoint: { lat: 40.8448, lng: -73.9386, name: 'Fort Tryon Park' },
    checkpoints: [
      { id: 'cp6', name: 'Overlook Point', lat: 40.8490, lng: -73.9395, description: 'Amazing city views' },
      { id: 'cp7', name: 'Summit Rest Area', lat: 40.8530, lng: -73.9410, description: 'Peak elevation point' },
      { id: 'cp8', name: 'Woodland Trail', lat: 40.8460, lng: -73.9420, description: 'Shaded forest section' },
    ],
    routePath: [
      { lat: 40.8448, lng: -73.9386 },
      { lat: 40.8490, lng: -73.9395 },
      { lat: 40.8530, lng: -73.9410 },
      { lat: 40.8460, lng: -73.9420 },
      { lat: 40.8448, lng: -73.9386 },
    ],
    cyclistType: 'fitness',
    shade: 60,
    airQuality: 90,
    pointsOfInterestVisited: [
      { name: 'Cliffside Panorama Deck', description: 'High-altitude viewing deck with wide skyline panorama.', lat: 40.8518, lng: -73.9404 },
      { name: 'Ridge Water Refill Station', description: 'Convenient hydration stop near the steepest segment.', lat: 40.8476, lng: -73.9416 },
    ],
  },
  {
    id: '4',
    name: 'Waterfront Breeze',
    description: 'Gentle coastal route with fresh air and beautiful views',
    distance: 15.2,
    elevation: 30,
    estimatedTime: 55,
    rating: 4.7,
    reviewCount: 140,
    startPoint: { lat: 40.7033, lng: -74.0170, name: 'Battery Park' },
    endPoint: { lat: 40.7589, lng: -73.9935, name: 'Chelsea Piers' },
    checkpoints: [
      { id: 'cp9', name: 'Pier 25', lat: 40.7214, lng: -74.0134, description: 'Waterfront viewing area' },
      { id: 'cp10', name: 'Hudson River Park', lat: 40.7389, lng: -74.0089, description: 'Popular park area' },
    ],
    routePath: [
      { lat: 40.7033, lng: -74.0170 },
      { lat: 40.7214, lng: -74.0134 },
      { lat: 40.7389, lng: -74.0089 },
      { lat: 40.7589, lng: -73.9935 },
    ],
    cyclistType: 'general',
    shade: 50,
    airQuality: 95,
    pointsOfInterestVisited: [
      { name: 'Sunset Pier Promenade', description: 'Long waterfront boardwalk ideal for a quick scenic pause.', lat: 40.7442, lng: -74.0045 },
    ],
  },
  {
    id: '5',
    name: 'Park Explorer Route',
    description: 'Leisurely ride through multiple city parks',
    distance: 10.8,
    elevation: 55,
    estimatedTime: 40,
    rating: 4.6,
    reviewCount: 298,
    startPoint: { lat: 40.7812, lng: -73.9665, name: 'Metropolitan Museum' },
    endPoint: { lat: 40.7812, lng: -73.9665, name: 'Metropolitan Museum' },
    checkpoints: [
      { id: 'cp11', name: 'Conservatory Garden', lat: 40.7945, lng: -73.9520, description: 'Beautiful gardens' },
      { id: 'cp12', name: 'Harlem Meer', lat: 40.7972, lng: -73.9520, description: 'Peaceful lakeside' },
    ],
    routePath: [
      { lat: 40.7812, lng: -73.9665 },
      { lat: 40.7945, lng: -73.9520 },
      { lat: 40.7972, lng: -73.9520 },
      { lat: 40.7812, lng: -73.9665 },
    ],
    cyclistType: 'recreational',
    shade: 75,
    airQuality: 88,
    pointsOfInterestVisited: [
      { name: 'Rose Terrace Walk', description: 'Quiet flower-lined terrace path with shaded seating.', lat: 40.7931, lng: -73.9589 },
      { name: 'North Meadow Viewpoint', description: 'Broad green-space overlook with open lawn vistas.', lat: 40.7958, lng: -73.9604 },
    ],
  },
  {
    id: '6',
    name: 'Urban Sprint Route',
    description: 'Quick direct route for daily commuting',
    distance: 6.5,
    elevation: 15,
    estimatedTime: 20,
    rating: 4.4,
    reviewCount: 623,
    startPoint: { lat: 40.7614, lng: -73.9776, name: 'Rockefeller Center' },
    endPoint: { lat: 40.7425, lng: -74.0064, name: 'Hudson Yards' },
    checkpoints: [
      { id: 'cp13', name: 'Penn Station', lat: 40.7506, lng: -73.9935, description: 'Major transit hub' },
    ],
    routePath: [
      { lat: 40.7614, lng: -73.9776 },
      { lat: 40.7506, lng: -73.9935 },
      { lat: 40.7425, lng: -74.0064 },
    ],
    cyclistType: 'commuter',
    shade: 35,
    airQuality: 68,
    pointsOfInterestVisited: [
      { name: 'Hudson Greenway Connector', description: 'Fast connector segment used by weekday commuters.', lat: 40.7468, lng: -73.9996 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Ride History Mocks
// ---------------------------------------------------------------------------

export const mockRideHistory: RideHistory[] = [
  {
    id: '1',
    routeId: '1',
    routeName: 'Riverside Park Loop',
    completionDate: 'March 28, 2026',
    completionTime: '6:30 PM',
    startTime: '5:45 PM',
    endTime: '6:30 PM',
    totalTime: 45,
    distance: 12.5,
    avgSpeed: 16.7,
    checkpoints: 3,
    userRating: 5,
    userReview: 'Perfect evening ride! Great weather and smooth paths throughout.',
  },
  {
    id: '2',
    routeId: '2',
    routeName: 'City Commuter Express',
    completionDate: 'March 26, 2026',
    completionTime: '8:30 AM',
    startTime: '8:00 AM',
    endTime: '8:30 AM',
    totalTime: 30,
    distance: 9.4,
    avgSpeed: 18.8,
    checkpoints: 2,
    userRating: 4,
    userReview: 'Quick commute to work. Bike lanes are clear and traffic was light.',
  },
  {
    id: '3',
    routeId: '3',
    routeName: 'Hill Challenge Trail',
    completionDate: 'March 24, 2026',
    completionTime: '2:45 PM',
    startTime: '12:30 PM',
    endTime: '2:45 PM',
    totalTime: 135,
    distance: 21.8,
    avgSpeed: 9.7,
    checkpoints: 3,
    userRating: 5,
    userReview: 'Challenging elevation but absolutely worth it. Stunning summit views and well-marked trail.',
  },
];

export const mockRideHistoryById: Record<string, RideHistory> = Object.fromEntries(
  mockRideHistory.map((ride) => {
    const route = mockRoutes.find((item) => item.id === ride.routeId);

    return [
      ride.id,
      {
        ...ride,
        visitedCheckpoints: route?.checkpoints,
        pointsOfInterestVisited: route?.pointsOfInterestVisited,
        routeDetails: route,
      } satisfies RideHistory,
    ];
  }),
);

export const mockWeeklyData: GraphDataPoint[] = [
  { id: 'mon', day: 'Mon', distance: 21.8 },
  { id: 'tue', day: 'Tue', distance: 0 },
  { id: 'wed', day: 'Wed', distance: 9.4 },
  { id: 'thu', day: 'Thu', distance: 0 },
  { id: 'fri', day: 'Fri', distance: 12.5 },
  { id: 'sat', day: 'Sat', distance: 0 },
  { id: 'sun', day: 'Sun', distance: 0 },
];

export const mockMonthlyData: GraphDataPoint[] = [
  { id: 'week1', week: 'Week 1', distance: 28.5 },
  { id: 'week2', week: 'Week 2', distance: 42.1 },
  { id: 'week3', week: 'Week 3', distance: 48.8 },
  { id: 'week4', week: 'Week 4', distance: 43.7 },
];

// ---------------------------------------------------------------------------
// Admin Dashboard Mocks
// ---------------------------------------------------------------------------

export const mockAdminStats: AdminStats = {
  totalRides: 1280,
  activeUsers: 452,
  revenueFormatted: '$12.4k',
  openReports: 12,
};

export const mockAdminUsers: AdminUser[] = [
  { id: 'u1', email: 'alex@email.com', role: 'user', status: 'Active', joinedFormatted: 'Jan 2025' },
  { id: 'u2', email: 'jamie@email.com', role: 'user', status: 'Active', joinedFormatted: 'Feb 2025' },
  { id: 'u3', email: 'grace@email.com', role: 'user', status: 'Inactive', joinedFormatted: 'Feb 2025' },
  { id: 'u4', email: 'admin@cyclink.com', role: 'admin', status: 'Active', joinedFormatted: 'Jan 2025' },
  { id: 'u5', email: 'business@cyclink.com', role: 'business', status: 'Active', joinedFormatted: 'Jan 2025' },
];

// ---------------------------------------------------------------------------
// Business Dashboard Mocks
// ---------------------------------------------------------------------------

export const mockBusinessStats: BusinessStats = {
  activeSponsors: 8,
  dataPoints: '45.2k',
  totalSpentFormatted: '$3,420',
  userReach: '8.5k',
};

export const mockBusinessLandingStats: BusinessLandingStats = {
  monthlyUsers: 5000,
  monthlyRouteRequests: 50000,
  activePartners: 8,
};

export const mockSponsoredLocations: SponsoredLocation[] = [
  { id: 'loc1', venue: 'Maxwell Food Centre', location: 'Tanjong Pagar', views: '1,200', clicks: '340', status: 'Live' },
  { id: 'loc2', venue: 'East Coast Park', location: 'Marine Parade', views: '980', clicks: '210', status: 'Pending' },
  { id: 'loc3', venue: 'Chinatown Heritage Trail', location: 'Chinatown', views: '750', clicks: '180', status: 'Live' },
  { id: 'loc4', venue: 'Bedok Interchange', location: 'Bedok', views: '620', clicks: '145', status: 'Pending' },
];
