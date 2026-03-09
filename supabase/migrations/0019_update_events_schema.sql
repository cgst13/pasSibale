
-- Update events table to use DATE type for start/end dates
ALTER TABLE events ALTER COLUMN start_date TYPE DATE USING start_date::DATE;
ALTER TABLE events ALTER COLUMN end_date TYPE DATE USING end_date::DATE;

-- Add attendance_config to events table to store time in/out rules
-- Structure: [{ "id": "uuid", "label": "Morning", "time_in_start": "HH:MM", "time_in_end": "HH:MM", "time_out_start": "HH:MM", "time_out_end": "HH:MM" }]
ALTER TABLE events ADD COLUMN attendance_config JSONB DEFAULT '[]'::JSONB;

-- Add logs to event_attendance to store multiple check-ins/outs
-- Structure: [{ "slot_id": "uuid", "time_in": "ISO", "time_out": "ISO" }]
ALTER TABLE event_attendance ADD COLUMN logs JSONB DEFAULT '[]'::JSONB;
