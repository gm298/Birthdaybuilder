-- Public bucket for digital menu dish photos (staff upload, guest read).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read menu images" on storage.objects;
create policy "public read menu images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

drop policy if exists "staff insert menu images" on storage.objects;
create policy "staff insert menu images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images' and public.is_staff());

drop policy if exists "staff update menu images" on storage.objects;
create policy "staff update menu images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images' and public.is_staff())
  with check (bucket_id = 'menu-images' and public.is_staff());

drop policy if exists "staff delete menu images" on storage.objects;
create policy "staff delete menu images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images' and public.is_staff());
