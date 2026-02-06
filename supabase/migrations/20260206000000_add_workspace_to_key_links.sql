-- Add workspace column to key_links table
-- This allows separate link panels for Work, Personal, and Generator workspaces

ALTER TABLE public.key_links ADD COLUMN IF NOT EXISTS workspace TEXT DEFAULT 'generator';

-- Update existing links to be in the generator workspace
UPDATE public.key_links SET workspace = 'generator' WHERE workspace IS NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view key links" ON public.key_links;
DROP POLICY IF EXISTS "Users can insert key links" ON public.key_links;
DROP POLICY IF EXISTS "Users can update key links" ON public.key_links;
DROP POLICY IF EXISTS "Users can delete key links" ON public.key_links;

-- New policies: Generator links are shared, Work/Personal links are private to user

-- SELECT: Users can view generator links (shared) OR their own work/personal links
CREATE POLICY "Users can view key links"
ON public.key_links
FOR SELECT
TO authenticated
USING (
  workspace = 'generator'
  OR (workspace IN ('work', 'personal') AND created_by = auth.uid())
);

-- INSERT: Users can insert links to any workspace
CREATE POLICY "Users can insert key links"
ON public.key_links
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Users can update generator links OR their own work/personal links
CREATE POLICY "Users can update key links"
ON public.key_links
FOR UPDATE
TO authenticated
USING (
  workspace = 'generator'
  OR (workspace IN ('work', 'personal') AND created_by = auth.uid())
)
WITH CHECK (true);

-- DELETE: Users can delete generator links OR their own work/personal links
CREATE POLICY "Users can delete key links"
ON public.key_links
FOR DELETE
TO authenticated
USING (
  workspace = 'generator'
  OR (workspace IN ('work', 'personal') AND created_by = auth.uid())
);
