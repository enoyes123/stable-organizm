
-- Create a table to store organism items (goals, sub-goals, tasks)
CREATE TABLE public.organism_items (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('goal', 'subgoal', 'task')),
  parent_id TEXT,
  is_collapsed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint for parent-child relationships
ALTER TABLE public.organism_items 
ADD CONSTRAINT fk_parent_id 
FOREIGN KEY (parent_id) REFERENCES public.organism_items(id) ON DELETE CASCADE;

-- Create an index for better performance on parent_id queries
CREATE INDEX idx_organism_items_parent_id ON public.organism_items(parent_id);

-- Create an index for sorting
CREATE INDEX idx_organism_items_sort_order ON public.organism_items(sort_order);

-- Add Row Level Security (RLS) to make data public for now
ALTER TABLE public.organism_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for everyone (public app)
CREATE POLICY "Allow all operations for everyone" 
  ON public.organism_items 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
