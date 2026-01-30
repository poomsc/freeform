-- ============================================
-- Storage policies for the "snapshots" bucket
-- Run this AFTER creating the bucket
-- ============================================

-- Allow authenticated users to upload files to their own folder
create policy "Users can upload own snapshots"
  on storage.objects for insert
  with check (
    bucket_id = 'snapshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own files
create policy "Users can update own snapshots"
  on storage.objects for update
  using (
    bucket_id = 'snapshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access (for widget)
create policy "Public read access for snapshots"
  on storage.objects for select
  using (bucket_id = 'snapshots');
