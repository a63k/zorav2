import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Ensure URL is a valid http/https URL format or use default valid fallback
const DEFAULT_URL = 'https://demo-zora-project.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8tcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.demo-signature';

function getValidSupabaseUrl(): string {
  if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
    try {
      new URL(rawUrl);
      return rawUrl;
    } catch {
      return DEFAULT_URL;
    }
  }
  return DEFAULT_URL;
}

const supabaseUrl = getValidSupabaseUrl();
const supabaseAnonKey = rawKey && rawKey.length > 10 ? rawKey : DEFAULT_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

export interface MediaLink {
  id?: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  season_number?: number | null;
  episode_number?: number | null;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  mp4_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdsterraConfig {
  banner_728x90?: string;
  banner_300x250?: string;
  popunder?: string;
  directlink?: string;
  enabled?: boolean;
}

export interface SiteSettings {
  key: string;
  value: {
    enabled: boolean;
    rewarded_ad_seconds: number;
    banner_728x90_code: string;
    banner_300x250_code: string;
    popunder_script: string;
  };
}

