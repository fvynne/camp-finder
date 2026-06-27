import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaced in the Metro logs — a common first-run gotcha.
  console.warn(
    'Supabase env vars missing. Copy app/.env.example to app/.env and restart Expo with: npx expo start -c'
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: false }, // MVP has no login yet
});
