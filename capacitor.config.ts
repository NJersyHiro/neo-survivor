import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neosurvivor.app',
  appName: 'Neo Survivor',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
