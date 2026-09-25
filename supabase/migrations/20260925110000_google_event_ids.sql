alter table public.requests
  add column if not exists google_event_ids jsonb not null default '[]'::jsonb;
