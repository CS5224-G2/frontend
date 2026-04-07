import 'react-native-gesture-handler';
import { synchronizeLocalDbFromMocks } from './src/services/localDb';
import './src/services/backgroundRideTracking';
import './src/services/rideNotifications';

void synchronizeLocalDbFromMocks().catch((error) => {
  console.error('Failed to initialize local SQLite data', error);
});

import 'expo-router/entry';
