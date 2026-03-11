import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neosurvivor.app',
  appName: 'Neo Survivor',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
  },
  server: {
    // Allow inline media playback without requiring user action per element
    iosScheme: 'capacitor',
  },
};

export default config;
