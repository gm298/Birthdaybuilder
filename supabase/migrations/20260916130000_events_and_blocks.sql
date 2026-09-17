do $$ begin
  alter type public.request_source add value 'event';
exception when duplicate_object then null;
end $$;

drop policy if exists "staff insert requests" on public.requests;
create policy "staff insert requests"
  on public.requests for insert
  to authenticated
  with check (public.is_staff());
