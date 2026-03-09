-- Add status column to citizens table
alter table public.citizens
add column "status" text default 'Active';

-- Add check constraint for status values
alter table public.citizens
add constraint check_status check (status in ('Active', 'Deceased', 'Archived'));
