-- =========================================================
-- SQL SCHEMA FOR ZORA STREAMING PLATFORM (SUPABASE)
-- Copiez et collez ce script dans l'Éditeur SQL de votre projet Supabase
-- =========================================================

-- 1. Table media_links pour sauvegarder tous les liens MP4
CREATE TABLE IF NOT EXISTS public.media_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    season_number INTEGER DEFAULT 1,
    episode_number INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    mp4_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_media_target UNIQUE (tmdb_id, media_type, season_number, episode_number)
);

-- Index pour accélérer la recherche des flux vidéo
CREATE INDEX IF NOT EXISTS idx_media_links_lookup 
ON public.media_links (tmdb_id, media_type, season_number, episode_number);

-- Activer RLS avec politiques d'accès publiques pour la clé anon
ALTER TABLE public.media_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Media Links" ON public.media_links;
CREATE POLICY "Public Select Media Links" ON public.media_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Media Links" ON public.media_links;
CREATE POLICY "Public Insert Media Links" ON public.media_links FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Media Links" ON public.media_links;
CREATE POLICY "Public Update Media Links" ON public.media_links FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Media Links" ON public.media_links;
CREATE POLICY "Public Delete Media Links" ON public.media_links FOR DELETE USING (true);

-- 2. Table site_settings pour sauvegarder la configuration des pubs et du site
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Site Settings" ON public.site_settings;
CREATE POLICY "Public Select Site Settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert/Update Site Settings" ON public.site_settings;
CREATE POLICY "Public Insert/Update Site Settings" ON public.site_settings FOR ALL USING (true);

-- Configuration par défaut des publicités
INSERT INTO public.site_settings (key, value)
VALUES (
    'adsterra_config',
    '{
        "enabled": true,
        "rewarded_ad_seconds": 8,
        "banner_728x90_code": "<div class=\"p-4 text-center text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded\">[Adsterra Banner 728x90 Placement]</div>",
        "banner_300x250_code": "<div class=\"p-4 text-center text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded\">[Adsterra Banner 300x250 Placement]</div>",
        "popunder_script": "<!-- Adsterra Popunder Script Container -->"
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;
