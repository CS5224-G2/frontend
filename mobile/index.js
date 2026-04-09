import 'react-native-gesture-handler';
import { synchronizeLocalDbFromMocks } from './src/services/localDb';
import { clearRideNotifications } from './src/services/rideNotifications';
import './src/services/backgroundRideTracking';
import './src/services/rideNotifications';

void synchronizeLocalDbFromMocks().catch((error) => {
  console.error('Failed to initialize local SQLite data', error);
});

void clearRideNotifications().catch(() => {});

import 'expo-router/entry';
