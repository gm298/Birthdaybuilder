drop policy if exists "staff delete events" on public.requests;
create policy "staff delete events"
  on public.requests for delete
  to authenticated
  using (public.is_staff() and source = 'event');

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
    and r.status not in ('cancelled', 'rejected', 'closed')
    and jsonb_typeof(coalesce(r.payload -> 'reservation' -> 'tableIds', '[]'::jsonb)) = 'array'
    and jsonb_array_length(coalesce(r.payload -> 'reservation' -> 'tableIds', '[]'::jsonb)) > 0
    and not (
      r.source = 'reservation'
      and r.status in ('new', 'contacted', 'quoted')
      and (r.party_date + coalesce(r.party_time, time '00:00') + interval '15 minutes')
          < timezone('Asia/Makassar', now())
    );
$$;
