do $$ begin
  alter type public.request_source add value 'reservation';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.request_status add value 'cancelled';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.request_status add value 'rejected';
exception when duplicate_object then null;
end $$;
