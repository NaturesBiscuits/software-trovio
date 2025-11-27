import { config } from 'dotenv';
import type { ExpoConfig } from 'expo/config';
import { existsSync } from 'fs';
import { join } from 'path';

// Load .env.local if it exists; fallback to .env
const root = __dirname;
const localEnvPath = join(root, '.env.local');
const defaultEnvPath = join(root, '.env');

if (existsSync(localEnvPath)) {
  config({ path: localEnvPath });
} else if (existsSync(defaultEnvPath)) {
  config({ path: defaultEnvPath });
} else {
  config();
}

const expoConfig: ExpoConfig = {
  name: 'trovio-app',
  slug: 'trovio-app',
  scheme: 'trovio-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  experiments: {
    tsconfigPaths: true,
  },

  ios: {
    infoPlist: {
      "ITSAppUsesNonExemptEncryption": false
    },
    bundleIdentifier: "com.trovio.app"
  },

  android: {
    package: "com.trovio.app",
    intentFilters: [
      {
        action: "VIEW",
        data: [
          { scheme: "com.trovio.app", host: "auth", pathPrefix: "/" }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },

  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
    eas: {
      // Ensure EAS project ID is always set for dynamic config
      projectId: process.env.EAS_PROJECT_ID ?? 'd7dfc260-847d-486a-93ec-6565f242c8d7',
    },
  },
};

export default expoConfig;


