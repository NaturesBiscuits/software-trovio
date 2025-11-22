import type { ExpoConfig } from 'expo/config';
import { config } from 'dotenv';
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
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? undefined,
    },
  },
};

export default expoConfig;


