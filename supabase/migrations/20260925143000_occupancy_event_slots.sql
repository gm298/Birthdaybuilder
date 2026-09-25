create or replace function public.reservation_occupancy(target_date date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(item), '[]'::jsonb)
  from (
    select
      jsonb_build_object(
        'time', to_char(r.party_time, 'HH24:MI'),
        'endTime', nullif(r.payload #>> '{reservation,endTime}', ''),
        'tableIds', coalesce(r.payload -> 'reservation' -> 'tableIds', '[]'::jsonb),
        'status', r.status,
        'kind', case
          when r.source = 'party_builder' then 'birthday'
          when r.source = 'event' then 'event'
          else 'reservation'
        end,
        'slots', case
          when r.source = 'event'
            and jsonb_typeof(r.payload #> '{event,slots}') = 'array'
            and jsonb_array_length(r.payload #> '{event,slots}') > 0
            then r.payload #> '{event,slots}'
          else '[]'::jsonb
        end
      ) as item
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
      )
  ) q;
$$;

revoke all on function public.reservation_occupancy(date) from public;
grant execute on function public.reservation_occupancy(date) to anon, authenticated, service_role;
