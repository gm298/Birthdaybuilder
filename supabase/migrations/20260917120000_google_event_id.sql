alter table public.requests
  add column if not exists google_event_id text;

create unique index if not exists requests_google_event_id_uidx
  on public.requests (google_event_id)
  where google_event_id is not null;
