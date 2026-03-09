
-- Create program-logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-logos', 'program-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of program logos
CREATE POLICY "Public Access Program Logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'program-logos' );

-- Policy to allow authenticated users to upload program logos
CREATE POLICY "Authenticated users can upload program logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'program-logos' );

-- Policy to allow authenticated users to update program logos
CREATE POLICY "Authenticated users can update program logos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'program-logos' );

-- Policy to allow authenticated users to delete program logos
CREATE POLICY "Authenticated users can delete program logos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'program-logos' );
