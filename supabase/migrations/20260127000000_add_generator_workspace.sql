-- Add Generator workspace support with shared access for all authenticated users
-- This does NOT affect existing Work/Personal data - those remain user-private

-- Add policies for shared 'generator' workspace
-- All authenticated users can view generator items
CREATE POLICY "Users can view generator items"
ON public.organism_items
FOR SELECT
TO authenticated
USING (workspace = 'generator');

-- All authenticated users can insert generator items
CREATE POLICY "Users can insert generator items"
ON public.organism_items
FOR INSERT
TO authenticated
WITH CHECK (workspace = 'generator');

-- All authenticated users can update generator items
CREATE POLICY "Users can update generator items"
ON public.organism_items
FOR UPDATE
TO authenticated
USING (workspace = 'generator')
WITH CHECK (workspace = 'generator');

-- All authenticated users can delete generator items
CREATE POLICY "Users can delete generator items"
ON public.organism_items
FOR DELETE
TO authenticated
USING (workspace = 'generator');
