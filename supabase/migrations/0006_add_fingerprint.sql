-- Add fingerprintTemplate column to citizens table
alter table public.citizens
add column "fingerprintTemplate" text;
