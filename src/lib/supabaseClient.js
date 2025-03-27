import {
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_PROJECT_URL,
} from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  PUBLIC_SUPABASE_PROJECT_URL,
  PUBLIC_SUPABASE_ANON_KEY,
);
