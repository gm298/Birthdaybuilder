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
    and r.status not in ('cancelled', 'rejected', 'closed')
    and not (
      r.status in ('new', 'contacted', 'quoted')
      and (r.party_date + coalesce(r.party_time, time '00:00') + interval '15 minutes')
          < timezone('Asia/Makassar', now())
    );
$$;
