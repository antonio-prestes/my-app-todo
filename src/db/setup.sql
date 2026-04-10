-- 1. Create Storage Bucket for Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Avatar Access' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Avatar Access" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Avatar Upload' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Authenticated Avatar Upload" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Avatar Update' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Authenticated Avatar Update" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'avatars' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;

-- 3. Users Table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'users' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own profile' AND tablename = 'users' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can read own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- 4. Workspaces Table RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own workspaces' AND tablename = 'workspaces' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can read own workspaces" ON public.workspaces
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own workspaces' AND tablename = 'workspaces' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can create own workspaces" ON public.workspaces
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own workspaces' AND tablename = 'workspaces' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can update own workspaces" ON public.workspaces
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own workspaces' AND tablename = 'workspaces' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can delete own workspaces" ON public.workspaces
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
