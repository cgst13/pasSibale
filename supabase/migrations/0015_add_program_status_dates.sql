
-- Add status column to program_definitions
ALTER TABLE public.program_definitions
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';

-- Remove start_date and end_date columns if they exist (cleanup from previous attempt)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'program_definitions' AND column_name = 'start_date') THEN
        ALTER TABLE public.program_definitions DROP COLUMN start_date;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'program_definitions' AND column_name = 'end_date') THEN
        ALTER TABLE public.program_definitions DROP COLUMN end_date;
    END IF;
END $$;


-- Add check constraint for status values (optional but good practice)
-- ALTER TABLE public.program_definitions ADD CONSTRAINT check_status_valid CHECK (status IN ('Active', 'Inactive', 'Archived', 'Pending'));
