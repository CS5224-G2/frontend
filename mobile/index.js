import 'react-native-gesture-handler';
import { synchronizeLocalDbFromMocks } from './src/services/localDb';
import {
  clearRideNotifications,
  initializeRideNotifications,
} from './src/services/rideNotifications';
import './src/services/backgroundRideTracking';

void synchronizeLocalDbFromMocks().catch((error) => {
  console.error('Failed to initialize local SQLite data', error);
});

initializeRideNotifications();
void clearRideNotifications().catch(() => {});

import 'expo-router/entry';
