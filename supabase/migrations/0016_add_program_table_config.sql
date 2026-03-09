
-- Add table_config column to program_definitions
ALTER TABLE program_definitions 
ADD COLUMN IF NOT EXISTS table_config JSONB DEFAULT '{"columns": ["id", "firstName", "lastName", "barangay", "status"]}'::jsonb;

-- Update existing records to have default config if null
UPDATE program_definitions 
SET table_config = '{"columns": ["id", "firstName", "lastName", "barangay", "status"]}'::jsonb 
WHERE table_config IS NULL;
