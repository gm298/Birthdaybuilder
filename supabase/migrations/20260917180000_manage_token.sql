-- Guest manage / share token for booking pages (unguessable; not the short public_code).

alter table public.requests
  add column if not exists manage_token uuid;

update public.requests
set manage_token = gen_random_uuid()
where manage_token is null;

alter table public.requests
  alter column manage_token set default gen_random_uuid();

do $$ begin
  alter table public.requests
    alter column manage_token set not null;
exception
  when others then null;
end $$;

do $$ begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'requests_manage_token_key'
      and conrelid = 'public.requests'::regclass
  ) then
    alter table public.requests
      add constraint requests_manage_token_key unique (manage_token);
  end if;
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;

create index if not exists requests_manage_token_idx on public.requests (manage_token);
