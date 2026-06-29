-- Supabase Schema for ResultVeda
-- Run this in your Supabase SQL Editor

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_hindi TEXT,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    title_hindi TEXT,
    post_name TEXT,
    vacancies INTEGER DEFAULT 0,
    total_vacancies INTEGER DEFAULT 0,
    content_english TEXT,
    content_hindi TEXT,
    apply_link TEXT,
    official_site TEXT,
    status TEXT DEFAULT 'draft',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    bilingual_html TEXT,
    department TEXT,
    advt_no TEXT,
    start_date DATE,
    end_date DATE,
    admit_card_date DATE,
    exam_date DATE,
    result_date DATE,
    notification_link TEXT,
    admit_card_link TEXT,
    result_link TEXT,
    official_logo_url TEXT,
    short_info_en TEXT,
    short_info_hi TEXT,
    official_website TEXT,
    view_count INTEGER DEFAULT 0,
    click_apply INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Helper Functions for Counters
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts
    SET view_count = view_count + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_apply_click(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts
    SET click_apply = click_apply + 1
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set up Row Level Security (RLS)
-- Categories: Anyone can read, only authenticated (admins) can write
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- Posts: Anyone can read, only authenticated (admins) can write
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access on posts" ON public.posts FOR ALL USING (auth.role() = 'authenticated');
