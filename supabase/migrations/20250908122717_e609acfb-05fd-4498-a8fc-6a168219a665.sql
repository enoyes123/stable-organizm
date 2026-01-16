-- Adjust RLS policies to preserve legacy (NULL user_id) data visibility and allow migration
DROP POLICY IF EXISTS "Users can view their own items" ON public.organism_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON public.organism_items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.organism_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON public.organism_items;

-- SELECT: own items or legacy (NULL user_id) items for authenticated users
CREATE POLICY "Users can view own and legacy items"
ON public.organism_items
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- INSERT: only own items
CREATE POLICY "Users can insert their own items"
ON public.organism_items
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: own items
CREATE POLICY "Users can update their own items"
ON public.organism_items
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- UPDATE: allow claiming legacy items by setting user_id
CREATE POLICY "Users can claim legacy items"
ON public.organism_items
FOR UPDATE
TO authenticated
USING (user_id IS NULL)
WITH CHECK (user_id = auth.uid());

-- DELETE: own items
CREATE POLICY "Users can delete their own items"
ON public.organism_items
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- DELETE: allow removing legacy items during migration
CREATE POLICY "Users can delete legacy items"
ON public.organism_items
FOR DELETE
TO authenticated
USING (user_id IS NULL);