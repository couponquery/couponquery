import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function handler(event) {
  const brand = event.queryStringParameters.brand;
  if (!brand) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing brand name' }) };
  }

  const { data: brandRow, error: brandErr } = await supabase
    .from('brands')
    .select('id,name')
    .ilike('name', brand)
    .single();

  if (brandErr || !brandRow) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Brand not found' }) };
  }

  const { data, error } = await supabase
    .from('codes')
    .select('id, code, discount_text, terms, added_at, validations(verified, verified_at)')
    .eq('brand_id', brandRow.id)
    .order('added_at', { ascending: false })
    .limit(50);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ brand: brandRow.name, codes: data }) };
}
