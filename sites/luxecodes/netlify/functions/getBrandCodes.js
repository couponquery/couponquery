// netlify/functions/getBrandCodes.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function(event) {
  const brandParam = event.queryStringParameters?.brand || null;

  try {
    let query = supabase
      .from('codes')
      .select('id, code, discount_text, terms, last_verified, expires_at, revoked, is_demo, brand')
      .neq('revoked', true)
      .eq('is_demo', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (brandParam) query = query.eq('brand', brandParam);

    const { data: codes, error: codesErr } = await query;
    if (codesErr) throw codesErr;

    const brandNames = [...new Set((codes || []).map(c => c.brand).filter(Boolean))];
    const { data: brands, error: brandsErr } = await supabase
      .from('brands')
      .select('name, logo_url')
      .in('name', brandNames);
    if (brandsErr) throw brandsErr;

    const brandMap = Object.fromEntries((brands || []).map(b => [b.name, b.logo_url || null]));

    const payload = (codes || []).map(c => ({
      id: c.id,
      code: c.code,
      discount_text: c.discount_text,
      terms: c.terms,
      last_verified: c.last_verified,
      brand: c.brand || null,
      logo_url: brandMap[c.brand] || null
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: payload })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
