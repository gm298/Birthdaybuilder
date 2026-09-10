create extension if not exists pgcrypto;

do $$ begin
  create type public.request_source as enum ('party_builder', 'cake', 'pdf_quote');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('new', 'contacted', 'quoted', 'booked', 'closed');
exception when duplicate_object then null;
end $$;

create table if not exists public.staff_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source public.request_source not null,
  status public.request_status not null default 'new',
  public_code text not null unique,
  idempotency_key text unique,
  email text,
  phone text,
  contact_name text,
  party_date date,
  party_time time,
  child_name text,
  child_age text,
  package_id text,
  package_name text,
  day_type text,
  guest_kids integer,
  guest_adults integer,
  quote_subtotal_idr bigint,
  quote_service_idr bigint,
  quote_tax_idr bigint,
  quote_total_idr bigint,
  quote_dp_idr bigint,
  payload jsonb not null default '{}'::jsonb,
  files jsonb not null default '{}'::jsonb,
  client jsonb not null default '{}'::jsonb,
  staff_notes text,
  status_changed_at timestamptz,
  status_changed_by uuid references auth.users (id),
  constraint requests_contact_required check (email is not null or phone is not null),
  constraint requests_email_format check (
    email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint requests_phone_format check (
    phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create table if not exists public.submit_rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  hit_count integer not null default 0,
  primary key (ip_hash, window_start)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
before update on public.requests
for each row execute procedure public.set_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_users s
    where s.user_id = auth.uid()
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated, service_role;

create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_status_idx on public.requests (status);
create index if not exists requests_party_date_idx on public.requests (party_date);
create index if not exists requests_source_idx on public.requests (source);
create index if not exists requests_email_idx on public.requests (email);
create index if not exists requests_phone_idx on public.requests (phone);

alter table public.staff_users enable row level security;
alter table public.requests enable row level security;
alter table public.submit_rate_limits enable row level security;

drop policy if exists "staff read staff_users" on public.staff_users;
create policy "staff read staff_users"
  on public.staff_users for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "staff select requests" on public.requests;
create policy "staff select requests"
  on public.requests for select
  to authenticated
  using (public.is_staff());

drop policy if exists "staff update requests" on public.requests;
create policy "staff update requests"
  on public.requests for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-files',
  'request-files',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "staff read request files" on storage.objects;
create policy "staff read request files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'request-files' and public.is_staff());
