-- Add logo_url column to program_definitions
ALTER TABLE public.program_definitions ADD COLUMN IF NOT EXISTS logo_url text;
