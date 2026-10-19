-- Bank account printed on birthday invoices. Staff edit this from Master data.

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values (
  'bank',
  '{"bank":"BCA","accountName":"Tiny Healthy Cafe","accountNumber":""}'::jsonb
)
on conflict (key) do nothing;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute procedure public.set_updated_at();

grant select, insert, update on public.site_settings to authenticated;

alter table public.site_settings enable row level security;

drop policy if exists "staff read site settings" on public.site_settings;
create policy "staff read site settings"
  on public.site_settings for select
  to authenticated
  using (public.is_staff());

drop policy if exists "staff insert site settings" on public.site_settings;
create policy "staff insert site settings"
  on public.site_settings for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "staff update site settings" on public.site_settings;
create policy "staff update site settings"
  on public.site_settings for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

notify pgrst, 'reload schema';
