
-- Add the workspace column to the organism_items table
ALTER TABLE public.organism_items 
ADD COLUMN workspace TEXT NOT NULL DEFAULT 'work';

-- Create an index for better performance when filtering by workspace
CREATE INDEX idx_organism_items_workspace ON public.organism_items(workspace);
