
-- Add recompensa to wanted_list
ALTER TABLE public.wanted_list ADD COLUMN IF NOT EXISTS recompensa bigint DEFAULT 0;

-- Add tipo to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'vivienda';

-- Drop the restrictive "no public access" policy and replace with public read
DROP POLICY IF EXISTS "No public access to wanted list" ON public.wanted_list;
CREATE POLICY "Anyone can view active wanted" ON public.wanted_list FOR SELECT USING (activo = true);
