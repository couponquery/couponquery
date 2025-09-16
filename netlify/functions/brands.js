import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function handler() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, site_url, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
  return { statusCode: 200, body: JSON.stringify({ brands: data }) };
}
