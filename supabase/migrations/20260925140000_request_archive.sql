alter table public.requests
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users (id);

create index if not exists requests_archived_at_idx
  on public.requests (archived_at)
  where archived_at is not null;

create or replace function public.reservation_occupancy(target_date date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'time', to_char(r.party_time, 'HH24:MI'),
        'endTime', nullif(r.payload #>> '{reservation,endTime}', ''),
        'tableIds', coalesce(r.payload -> 'reservation' -> 'tableIds', '[]'::jsonb),
        'status', r.status,
        'kind', case
          when r.source = 'party_builder' then 'birthday'
          when r.source = 'event' then 'event'
          else 'reservation'
        end
      )
    ),
    '[]'::jsonb
  )
  from public.requests r
  where r.source in ('reservation', 'event', 'party_builder')
    and r.party_date = target_date
    and r.archived_at is null
    and r.status not in ('cancelled', 'rejected', 'closed', 'noshow')
    and jsonb_typeof(coalesce(r.payload -> 'reservation' -> 'tableIds', '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(r.payload -> 'reservation' -> 'tableIds', '[]'::jsonb)) > 0
    and not (
      r.source = 'reservation'
      and r.status in ('new', 'contacted', 'quoted')
      and (r.party_date + coalesce(r.party_time, time '00:00') + interval '15 minutes')
          < timezone('Asia/Makassar', now())
    );
$$;

create or replace function public.list_public_events()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(to_jsonb(t) order by t.party_date, t.start_time),
    '[]'::jsonb
  )
  from (
    select
      r.public_code,
      coalesce(nullif(r.payload #>> '{event,name}', ''), r.contact_name, 'Event') as name,
      coalesce(r.payload #>> '{event,about}', '') as about,
      r.party_date::text as party_date,
      to_char(r.party_time, 'HH24:MI') as start_time,
      coalesce(r.payload #>> '{reservation,endTime}', '') as end_time,
      case
        when r.payload #>> '{event,location}' = 'masterclass' then 'In masterclass'
        else 'In service area'
      end as location_label,
      case
        when coalesce(r.payload #>> '{event,pricing,total}', '') ~ '^[0-9]+$'
          then (r.payload #>> '{event,pricing,total}')::bigint
        else r.quote_total_idr
      end as price_idr,
      coalesce(r.payload #>> '{event,coverUrl}', '') as cover_url,
      case
        when jsonb_typeof(r.payload #> '{event,gallery}') = 'array'
          and jsonb_array_length(r.payload #> '{event,gallery}') > 0
          then r.payload #> '{event,gallery}'
        when coalesce(r.payload #>> '{event,coverUrl}', '') <> ''
          then jsonb_build_array(r.payload #>> '{event,coverUrl}')
        else '[]'::jsonb
      end as gallery,
      coalesce(nullif(r.payload #>> '{event,repeat,freq}', ''), 'none') as repeat_freq,
      coalesce(r.payload #>> '{event,repeat,until}', '') as repeat_until,
      coalesce(r.payload #> '{event,slots}', '[]'::jsonb) as slots
    from public.requests r
    where r.source = 'event'
      and r.archived_at is null
      and r.status not in ('cancelled', 'rejected', 'closed', 'noshow')
  ) t;
$$;

revoke all on function public.list_public_events() from public;
grant execute on function public.list_public_events() to anon, authenticated;
