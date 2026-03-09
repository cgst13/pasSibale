
-- Add unique constraint to prevent duplicate enrollments
ALTER TABLE public.program_enrollments
ADD CONSTRAINT unique_program_enrollment UNIQUE (program_id, citizen_id);
