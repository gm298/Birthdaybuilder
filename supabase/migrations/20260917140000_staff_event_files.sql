drop policy if exists "staff write request files" on storage.objects;
create policy "staff write request files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'request-files' and public.is_staff());

drop policy if exists "staff update request files" on storage.objects;
create policy "staff update request files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'request-files' and public.is_staff())
  with check (bucket_id = 'request-files' and public.is_staff());
