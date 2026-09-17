drop policy if exists "staff delete events" on public.requests;
drop policy if exists "staff delete requests" on public.requests;
create policy "staff delete requests"
  on public.requests for delete
  to authenticated
  using (public.is_staff());
