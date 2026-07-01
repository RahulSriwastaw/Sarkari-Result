-- ==========================================
-- RESULTVEDA / CMS - SUPABASE SCHEMA SETUP
-- Paste this script into your Supabase SQL Editor (https://supabase.com/dashboard/project/kvyeumipuyooaprxlsah/sql/new)
-- ==========================================

-- 0. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_hindi TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6366F1',
    order_index INTEGER DEFAULT 99,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_hindi TEXT,
    content_hindi TEXT,
    content_english TEXT,
    excerpt TEXT,
    post_name TEXT,
    department TEXT,
    advt_no TEXT,
    total_vacancies INTEGER,
    vacancies INTEGER, -- Alias for total_vacancies
    vacancy_details JSONB DEFAULT '[]'::jsonb,
    eligibility JSONB DEFAULT '{}'::jsonb,
    important_dates JSONB DEFAULT '[]'::jsonb,
    start_date DATE,
    end_date DATE,
    admit_card_date DATE,
    exam_date DATE,
    result_date DATE,
    salary_range TEXT,
    apply_link TEXT,
    notification_link TEXT,
    admit_card_link TEXT,
    result_link TEXT,
    official_site TEXT,
    official_website TEXT, -- Alias for official_site
    official_logo_url TEXT,
    bilingual_html TEXT,
    short_info_en TEXT,
    short_info_hi TEXT,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}'::text[],
    state TEXT[] DEFAULT '{}'::text[],
    exam_type TEXT DEFAULT 'Other',
    source_type TEXT DEFAULT 'manual',
    source_url TEXT,
    ai_confidence NUMERIC DEFAULT 1.0,
    conflicts JSONB DEFAULT '[]'::jsonb,
    conflict_count INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    focus_keyword TEXT,
    keywords TEXT[] DEFAULT '{}'::text[],
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    shared_telegram BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    click_apply INTEGER DEFAULT 0
);

-- 3. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) & Policies
-- We disable RLS or add public permission for easy read-write.
-- For a secure production layout, we allow public read (anon) and authenticated write.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Allow public read access to categories" ON public.categories
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow write access to categories for authenticated users" ON public.categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access to categories for anon (development fallback)" ON public.categories
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Posts Policies
CREATE POLICY "Allow public read access to posts" ON public.posts
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow write access to posts for authenticated users" ON public.posts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access to posts for anon (development fallback)" ON public.posts
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Settings Policies
CREATE POLICY "Allow public read access to settings" ON public.settings
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow write access to settings for authenticated users" ON public.settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access to settings for anon (development fallback)" ON public.settings
    FOR ALL TO anon USING (true) WITH CHECK (true);


-- 5. Create Increment RPC Functions
-- Used for view counters and click trackers
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_apply_click(post_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.posts
    SET click_apply = COALESCE(click_apply, 0) + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Insert Default Sarkari Categories Seed Data
INSERT INTO public.categories (id, name, name_hindi, slug, description, icon, color, order_index)
VALUES 
  ('cat-1', 'SSC', 'एसएससी', 'ssc', 'Staff Selection Commission Jobs', '📋', '#FF6B2B', 1),
  ('cat-2', 'Railway', 'रेलवे', 'railway', 'Indian Railway Recruitment', '🚂', '#1E88E5', 2),
  ('cat-3', 'Banking', 'बैंकिंग', 'banking', 'Bank PO, Clerk, Specialist Officers', '🏦', '#43A047', 3),
  ('cat-4', 'UPSC', 'यूपीएससी', 'upsc', 'Union Public Service Commission', '🏛️', '#8E24AA', 4),
  ('cat-5', 'State PSC', 'राज्य लोक सेवा', 'state-psc', 'State Public Service Commission Jobs', '🏢', '#F4511E', 5),
  ('cat-6', 'Defence', 'डिफेन्स', 'defence', 'Army, Navy, Airforce Recruitment', '🪖', '#6D4C41', 6),
  ('cat-7', 'Police', 'पुलिस', 'police', 'State Police, Sub-Inspector, Constable', '👮', '#00897B', 7),
  ('cat-8', 'Teaching', 'शिक्षक भर्ती', 'teaching', 'TGT, PGT, Primary Teachers', '📚', '#039BE5', 8),
  ('cat-9', 'Results', 'परिणाम', 'results', 'Government Exam Results', '📊', '#E53935', 9),
  ('cat-10', 'Admit Card', 'प्रवेश पत्र', 'admit-card', 'Download Exam Hall Tickets', '🎫', '#FB8C00', 10),
  ('cat-11', 'Answer Key', 'उत्तर कुंजी', 'answer-key', 'Official Exam Answer Keys', '🔑', '#00ACC1', 11),
  ('cat-12', 'Syllabus', 'पाठ्यक्रम', 'syllabus', 'Exam Syllabi & Schemes', '📝', '#5E35B1', 12)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  name_hindi = EXCLUDED.name_hindi,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  order_index = EXCLUDED.order_index;

-- 7. Insert Initial Default Settings
INSERT INTO public.settings (key, value)
VALUES 
  ('site_name', 'ResultVeda'),
  ('site_tagline', 'Sarkari Result, Latest Jobs & Government Exam Updates'),
  ('telegram_channel', 'sarkariprep_telegram'),
  ('auto_share_telegram', 'false'),
  ('posts_per_page', '20')
ON CONFLICT (key) DO NOTHING;

-- 8. Create saved_jobs table (optional, for user feature)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to saved_jobs for anon" ON public.saved_jobs
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to saved_jobs for authenticated" ON public.saved_jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Create profiles table (optional, for user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT,
    dob TEXT,
    qualification TEXT,
    category TEXT,
    state TEXT,
    role TEXT DEFAULT 'user',
    profile_completion_percentage INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to profiles for anon" ON public.profiles
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to profiles for authenticated" ON public.profiles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
