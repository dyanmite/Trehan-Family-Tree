-- Add marriage date column
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS marriage_date DATE;

-- Add sibling reference (optional, for explicit sibling linking)
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS sibling_ids UUID[] DEFAULT '{}';

-- Note: death_date already exists in the original schema, no changes needed for it.
-- Note: relation_title already exists from the previous alter_table.sql.
