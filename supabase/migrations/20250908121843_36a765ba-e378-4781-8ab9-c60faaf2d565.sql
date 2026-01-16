-- Add user_id column to organism_items table for user-specific data
ALTER TABLE public.organism_items 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the overly permissive policy
DROP POLICY "Allow all operations for everyone" ON public.organism_items;

-- Create secure user-specific RLS policies
CREATE POLICY "Users can view their own items" 
ON public.organism_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" 
ON public.organism_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
ON public.organism_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
ON public.organism_items 
FOR DELETE 
USING (auth.uid() = user_id);