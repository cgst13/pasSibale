-- NOTE: These SQL commands are optional if you are using the Service Role Key (supabaseAdmin) 
-- in your application, as the admin client bypasses RLS and can manage buckets directly.

-- Create the storage bucket for citizen photos
-- insert into storage.buckets (id, name, public)
-- values ('citizen-photos', 'citizen-photos', true)
-- on conflict (id) do nothing;

-- Enable RLS on storage.objects (if not already enabled)
-- alter table storage.objects enable row level security;

-- Policy to allow public viewing of photos
-- create policy "Public Access"
--   on storage.objects for select
--   using ( bucket_id = 'citizen-photos' );

-- Policy to allow authenticated users to upload photos
-- create policy "Authenticated users can upload photos"
--   on storage.objects for insert
--   with check ( bucket_id = 'citizen-photos' and auth.role() = 'authenticated' );

-- Policy to allow authenticated users to update photos
-- create policy "Authenticated users can update photos"
--   on storage.objects for update
--   using ( bucket_id = 'citizen-photos' and auth.role() = 'authenticated' );

-- Policy to allow authenticated users to delete photos
-- create policy "Authenticated users can delete photos"
--   on storage.objects for delete
--   using ( bucket_id = 'citizen-photos' and auth.role() = 'authenticated' );
