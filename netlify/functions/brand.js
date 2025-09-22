import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  try {
    // Read ?brand=<slug>
    const url = new URL(event.rawUrl || `https://x.local${event.path}${event.rawQueryString ? '?' + event.rawQueryString : ''}`);
    const brandSlug = url.searchParams.get('brand');

    if (!brandSlug) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing brand query param' }),
      };
    }

    // Look up the brand by name
    const { data: brandRow, error: brandErr } = await supabase
      .from('brands')
      .select('id, name')
      .eq('name', brandSlug)
      .single();

    if (brandErr || !brandRow) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Brand not found', details: brandErr?.message }),
      };
    }

    // Fetch codes for that brand
    const { data: codes, error: codesErr } = await supabase
      .from('codes')
      .select('id, code, discount_text, terms, added_at')
      .eq('brand_id', brandRow.id)
      .order('added_at', { ascending: false });

    if (codesErr) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to load codes', details: codesErr.message }),
      };
    }

    // If no codes, return empty shape
    if (!codes || codes.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: brandSlug, count: 0, codes: [] }),
      };
    }

    // Fetch latest verification per code without using the view
    const codeIds = codes.map(c => c.id);
    const { data: valRows, error: valErr } = await supabase
      .from('validations')
      .select('code_id, verified_at')
      .in('code_id', codeIds);


    const maxVerified = new Map();
    for (const r of (valRows || [])) {
      const cur = maxVerified.get(r.code_id);
      if (!cur || new Date(r.verified_at) > new Date(cur)) {
        maxVerified.set(r.code_id, r.verified_at);
      }
    }

    const enriched = codes.map(c => ({
      ...c,
      last_verified: maxVerified.get(c.id) ?? null,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: brandSlug, count: enriched.length, codes: enriched }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unhandled error', details: String(err) }),
    };
  }
}