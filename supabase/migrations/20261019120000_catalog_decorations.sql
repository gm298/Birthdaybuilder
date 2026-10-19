-- Decoration pictures staff can upload from Master data.
-- The birthday builder uses these in place of the built-in photos.

create table if not exists public.catalog_images (
  slot text primary key,
  label text not null default '',
  image_path text not null,
  updated_at timestamptz not null default now(),
  constraint catalog_images_slot_len check (char_length(slot) between 3 and 80),
  constraint catalog_images_label_len check (char_length(label) <= 80),
  constraint catalog_images_path_len check (char_length(image_path) between 1 and 240)
);

grant select on public.catalog_images to anon, authenticated;
grant insert, update, delete on public.catalog_images to authenticated;

alter table public.catalog_images enable row level security;

drop policy if exists "public read catalog images" on public.catalog_images;
create policy "public read catalog images"
  on public.catalog_images for select
  to anon, authenticated
  using (true);

drop policy if exists "staff manage catalog images" on public.catalog_images;
create policy "staff manage catalog images"
  on public.catalog_images for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'decor-catalog',
  'decor-catalog',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read decor catalog images" on storage.objects;
create policy "public read decor catalog images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'decor-catalog');

drop policy if exists "staff insert decor catalog images" on storage.objects;
create policy "staff insert decor catalog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'decor-catalog' and public.is_staff());

drop policy if exists "staff update decor catalog images" on storage.objects;
create policy "staff update decor catalog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'decor-catalog' and public.is_staff())
  with check (bucket_id = 'decor-catalog' and public.is_staff());

drop policy if exists "staff delete decor catalog images" on storage.objects;
create policy "staff delete decor catalog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'decor-catalog' and public.is_staff());
