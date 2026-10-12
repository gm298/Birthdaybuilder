-- Cake photos uploaded from the staff Master data tab, and promo codes
-- guests can apply when booking a birthday or joining an event.

create table if not exists public.catalog_cakes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  theme text not null default '',
  image_path text not null,
  active boolean not null default true,
  constraint catalog_cakes_name_len check (char_length(trim(name)) between 1 and 80),
  constraint catalog_cakes_theme_len check (char_length(theme) <= 80)
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  code text not null,
  discount_type text not null,
  discount_value numeric not null,
  applies_to text not null default 'both',
  active boolean not null default true,
  starts_on date,
  ends_on date,
  max_uses integer,
  used_count integer not null default 0,
  notes text,
  constraint promotions_name_len check (char_length(trim(name)) between 1 and 80),
  constraint promotions_code_format check (code ~ '^[A-Z0-9][A-Z0-9-]{3,31}$'),
  constraint promotions_type check (discount_type in ('percent', 'fixed')),
  constraint promotions_applies check (applies_to in ('birthday', 'event', 'both')),
  constraint promotions_value check (
    (discount_type = 'percent' and discount_value > 0 and discount_value <= 100)
    or (discount_type = 'fixed' and discount_value > 0)
  ),
  constraint promotions_dates check (starts_on is null or ends_on is null or ends_on >= starts_on),
  constraint promotions_max_uses check (max_uses is null or max_uses > 0),
  constraint promotions_used check (used_count >= 0)
);

create unique index if not exists promotions_code_key on public.promotions (upper(code));

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at
before update on public.promotions
for each row execute procedure public.set_updated_at();

grant select on public.catalog_cakes to anon, authenticated;
grant insert, update, delete on public.catalog_cakes to authenticated;
grant select, insert, update, delete on public.promotions to authenticated, service_role;

alter table public.catalog_cakes enable row level security;
alter table public.promotions enable row level security;

drop policy if exists "public read active catalog cakes" on public.catalog_cakes;
create policy "public read active catalog cakes"
  on public.catalog_cakes for select
  to anon, authenticated
  using (active = true);

drop policy if exists "staff manage catalog cakes" on public.catalog_cakes;
create policy "staff manage catalog cakes"
  on public.catalog_cakes for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "staff manage promotions" on public.promotions;
create policy "staff manage promotions"
  on public.promotions for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cake-catalog',
  'cake-catalog',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read cake catalog images" on storage.objects;
create policy "public read cake catalog images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'cake-catalog');

drop policy if exists "staff insert cake catalog images" on storage.objects;
create policy "staff insert cake catalog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cake-catalog' and public.is_staff());

drop policy if exists "staff update cake catalog images" on storage.objects;
create policy "staff update cake catalog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cake-catalog' and public.is_staff())
  with check (bucket_id = 'cake-catalog' and public.is_staff());

drop policy if exists "staff delete cake catalog images" on storage.objects;
create policy "staff delete cake catalog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cake-catalog' and public.is_staff());

create or replace function public.preview_promotion(p_code text, p_channel text, p_amount bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  promo public.promotions%rowtype;
  today date := (now() at time zone 'Asia/Makassar')::date;
  channel text := lower(trim(coalesce(p_channel, '')));
  amount bigint := greatest(coalesce(p_amount, 0), 0);
  discount bigint := 0;
begin
  if channel not in ('birthday', 'event') then
    return jsonb_build_object('ok', false, 'error', 'That code cannot be used here.');
  end if;
  if trim(coalesce(p_code, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'Enter a promo code.');
  end if;

  select * into promo
  from public.promotions
  where upper(code) = upper(trim(p_code))
  limit 1;

  if not found or not promo.active then
    return jsonb_build_object('ok', false, 'error', 'That promo code is not valid.');
  end if;
  if promo.applies_to <> 'both' and promo.applies_to <> channel then
    return jsonb_build_object('ok', false, 'error', 'That code does not apply to this booking.');
  end if;
  if promo.starts_on is not null and today < promo.starts_on then
    return jsonb_build_object('ok', false, 'error', 'That code is not active yet.');
  end if;
  if promo.ends_on is not null and today > promo.ends_on then
    return jsonb_build_object('ok', false, 'error', 'That code has expired.');
  end if;
  if promo.max_uses is not null and promo.used_count >= promo.max_uses then
    return jsonb_build_object('ok', false, 'error', 'That code has been used up.');
  end if;

  if promo.discount_type = 'percent' then
    discount := round(amount * promo.discount_value / 100.0)::bigint;
  else
    discount := least(amount, round(promo.discount_value)::bigint);
  end if;
  discount := greatest(discount, 0);

  return jsonb_build_object(
    'ok', true,
    'id', promo.id,
    'name', promo.name,
    'code', promo.code,
    'discount_type', promo.discount_type,
    'discount_value', promo.discount_value,
    'discount_idr', discount
  );
end;
$$;

create or replace function public.redeem_promotion(p_code text, p_channel text, p_amount bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  preview jsonb;
  promo_id uuid;
  updated_id uuid;
begin
  preview := public.preview_promotion(p_code, p_channel, p_amount);
  if coalesce(preview ->> 'ok', 'false') <> 'true' then
    return preview;
  end if;
  promo_id := (preview ->> 'id')::uuid;
  update public.promotions
  set used_count = used_count + 1
  where id = promo_id
    and active
    and (max_uses is null or used_count < max_uses)
  returning id into updated_id;
  if updated_id is null then
    return jsonb_build_object('ok', false, 'error', 'That code has been used up.');
  end if;
  return preview;
end;
$$;

create or replace function public.release_promotion(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.promotions
  set used_count = greatest(used_count - 1, 0)
  where id = p_id;
end;
$$;

revoke all on function public.preview_promotion(text, text, bigint) from public;
grant execute on function public.preview_promotion(text, text, bigint) to anon, authenticated, service_role;

revoke all on function public.redeem_promotion(text, text, bigint) from public;
grant execute on function public.redeem_promotion(text, text, bigint) to service_role;

revoke all on function public.release_promotion(uuid) from public;
grant execute on function public.release_promotion(uuid) to service_role;
