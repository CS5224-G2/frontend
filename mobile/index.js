import { registerRootComponent } from 'expo';
import App from './src/app/App';
import { synchronizeLocalDbFromMocks } from './src/services/localDb';

void synchronizeLocalDbFromMocks().catch((error) => {
  console.error('Failed to initialize local SQLite data', error);
});

registerRootComponent(App);
