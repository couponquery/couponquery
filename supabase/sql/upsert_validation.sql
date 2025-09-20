create or replace function public.upsert_validation(
  p_code_id uuid,
  p_verified_at timestamptz,
  p_source text,
  p_status text
) returns void
language sql
security definer
as $$
  insert into public.validations (id, code_id, verified_at, source, status)
  values (gen_random_uuid(), p_code_id, p_verified_at, coalesce(p_source, 'n8n'), coalesce(p_status, 'verified'));
$$;

comment on function public.upsert_validation(uuid, timestamptz, text, text) is 'Insert a validation stamp for a code';

-- optional index if missing
create index if not exists idx_validations_verified_at on public.validations(verified_at);
