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
        'tableIds', coalesce(r.payload -> 'reservation' -> 'tableIds', '[]'::jsonb),
        'status', r.status
      )
    ),
    '[]'::jsonb
  )
  from public.requests r
  where r.source = 'reservation'
    and r.party_date = target_date
    and r.status not in ('cancelled', 'rejected', 'closed');
$$;

revoke all on function public.reservation_occupancy(date) from public;
grant execute on function public.reservation_occupancy(date) to anon, authenticated, service_role;

create index if not exists requests_reservation_slot_idx
  on public.requests (party_date, party_time)
  where source = 'reservation';
