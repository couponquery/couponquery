import { createClient } from '@supabase/supabase-js';

const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseSrv  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event) {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: ''
      };
    }
    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Use POST' });
    }

    const body = JSON.parse(event.body || '{}');
    const brandName = (body.brand || '').trim();
    const codeText  = (body.code  || '').trim();

    if (!brandName || !codeText) return json(400, { error: 'Missing brand or code' });

    // Find brand
    const { data: brand } = await supabaseAnon
      .from('brands')
      .select('id,name')
      .ilike('name', brandName)
      .maybeSingle();

    if (!brand) return json(404, { error: 'Brand not found' });

    // Find code
    const { data: codeRow } = await supabaseAnon
      .from('codes')
      .select('id,code')
      .eq('brand_id', brand.id)
      .ilike('code', codeText)
      .maybeSingle();

    if (!codeRow) return json(404, { error: 'Code not found for brand' });

    // stub verification - mark verified true for now
    const verified = true;
    const verifiedAt = new Date().toISOString();

    const { error: vErr } = await supabaseSrv
      .from('validations')
      .insert({
        code_id: codeRow.id,
        verified,
        verified_at: verifiedAt,
        notes: 'stub validation',
        checked_by: 'netlify-validate'
      });

    if (vErr) return json(500, { error: vErr.message });

    return json(200, { brand: brand.name, code: codeRow.code, verified, verified_at: verifiedAt });
  } catch (e) {
    return json(500, { error: e.message });
  }
}

function json(status, obj) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj)
  };
}
