-- Add Key Links table for Generator workspace
-- These links are shared among all authenticated users (like Generator items)

CREATE TABLE IF NOT EXISTS public.key_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.key_links ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view key links (shared)
CREATE POLICY "Users can view key links"
ON public.key_links
FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can insert key links
CREATE POLICY "Users can insert key links"
ON public.key_links
FOR INSERT
TO authenticated
WITH CHECK (true);

-- All authenticated users can update key links
CREATE POLICY "Users can update key links"
ON public.key_links
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- All authenticated users can delete key links
CREATE POLICY "Users can delete key links"
ON public.key_links
FOR DELETE
TO authenticated
USING (true);
