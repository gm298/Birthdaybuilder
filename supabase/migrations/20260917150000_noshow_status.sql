do $$ begin
  alter type public.request_status add value if not exists 'noshow';
exception
  when duplicate_object then null;
end $$;
