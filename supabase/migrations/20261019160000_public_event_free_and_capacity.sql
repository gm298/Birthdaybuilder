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
      (
        lower(coalesce(r.payload #>> '{event,pricing,free}', '')) in ('true', 't', '1')
      ) as is_free,
      case
        when lower(coalesce(r.payload #>> '{event,pricing,free}', '')) in ('true', 't', '1')
          then 0::bigint
        when coalesce(r.payload #>> '{event,pricing,total}', '') ~ '^[0-9]+(\.[0-9]+)?'
          then round((r.payload #>> '{event,pricing,total}')::numeric)::bigint
        when coalesce(r.payload #>> '{event,pricing,price}', '') ~ '^[0-9]+(\.[0-9]+)?'
          then round((r.payload #>> '{event,pricing,price}')::numeric)::bigint
        else coalesce(r.quote_total_idr, r.quote_subtotal_idr)
      end as price_idr,
      case
        when coalesce(r.payload #>> '{event,capacity}', '') ~ '^[1-9][0-9]*$'
          then (r.payload #>> '{event,capacity}')::integer
        else null
      end as capacity,
      (
        select coalesce(sum(greatest(1, coalesce((g->>'pax')::integer, 1))), 0)::integer
        from jsonb_array_elements(
          case
            when jsonb_typeof(r.payload #> '{event,guests}') = 'array'
              then r.payload #> '{event,guests}'
            else '[]'::jsonb
          end
        ) g
        where coalesce(g->>'archived_at', '') = ''
          and lower(coalesce(g->>'status', '')) <> 'rejected'
      ) as spots_taken,
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

notify pgrst, 'reload schema';
