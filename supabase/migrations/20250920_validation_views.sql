-- latest validation per code
create or replace view public.latest_validations as
select
  v.code_id,
  max(v.verified_at) as last_verified
from public.validations v
group by v.code_id;

-- helpful index in case it doesn't exist (no-op if it does)
create index if not exists idx_validations_code_id on public.validations(code_id);

-- RPC function to get brand codes with validations
create or replace function get_brand_codes_with_validations(brand_slug text, limit_count int default 50)
returns table (
  id uuid,
  code text,
  discount_text text,
  terms text,
  added_at timestamptz,
  last_verified timestamptz
)
language sql
security definer
as $$
  select
    c.id,
    c.code,
    c.discount_text,
    c.terms,
    c.added_at,
    lv.last_verified
  from codes c
  join brands b on b.id = c.brand_id
  left join latest_validations lv on lv.code_id = c.id
  where (brand_slug is null or b.slug = brand_slug)
  order by lv.last_verified desc nulls last, c.added_at desc
  limit limit_count;
$$;

-- permissions (optional; assumes anon or service role will read via RPC)
comment on view public.latest_validations is 'Latest validation timestamp per code_id';
comment on function get_brand_codes_with_validations is 'Get brand codes with latest validation timestamps';
