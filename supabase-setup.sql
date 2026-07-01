-- 1. Ensure scheduling support exists on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- 2. Create saved_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

-- 3. Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- 4. Drop policies
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
DROP POLICY IF EXISTS "Allow anon insert on categories" ON categories;
DROP POLICY IF EXISTS "Allow anon update on categories" ON categories;
DROP POLICY IF EXISTS "Allow anon delete on categories" ON categories;

DROP POLICY IF EXISTS "Allow public read access on posts" ON posts;
DROP POLICY IF EXISTS "Allow anon insert on posts" ON posts;
DROP POLICY IF EXISTS "Allow anon update on posts" ON posts;
DROP POLICY IF EXISTS "Allow anon delete on posts" ON posts;

DROP POLICY IF EXISTS "Users can view their own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can save jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON saved_jobs;

-- 5. Create policies
CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow anon insert on categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete on categories" ON categories FOR DELETE USING (true);

CREATE POLICY "Allow public read access on posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow anon insert on posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update on posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete on posts" ON posts FOR DELETE USING (true);

CREATE POLICY "Users can view their own saved jobs" ON public.saved_jobs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON public.saved_jobs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved jobs" ON public.saved_jobs
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
