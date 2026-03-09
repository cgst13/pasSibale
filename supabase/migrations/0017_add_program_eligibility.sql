-- Add eligibility_criteria column to program_definitions
ALTER TABLE program_definitions 
ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB DEFAULT NULL;

-- Comment on column
COMMENT ON COLUMN program_definitions.eligibility_criteria IS 'JSON object storing eligibility rules: minAge, maxAge, sex, residency (barangays)';
