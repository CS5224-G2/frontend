import 'react-native-gesture-handler';
import { synchronizeLocalDbFromMocks } from './src/services/localDb';

void synchronizeLocalDbFromMocks().catch((error) => {
  console.error('Failed to initialize local SQLite data', error);
});

import 'expo-router/entry';
