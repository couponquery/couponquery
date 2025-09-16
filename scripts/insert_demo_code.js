import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function insertDemoCode() {
  try {
    console.log('🚀 Starting demo code insertion...');

    // First, check if "demo" brand exists
    console.log('🔍 Checking if "demo" brand exists...');
    const { data: existingBrand, error: brandCheckError } = await supabase
      .from('brands')
      .select('id, name')
      .ilike('name', 'demo')
      .single();

    let brandId;

    if (brandCheckError && brandCheckError.code === 'PGRST116') {
      // Brand doesn't exist, create it
      console.log('📝 Creating "demo" brand...');
      const { data: newBrand, error: brandCreateError } = await supabase
        .from('brands')
        .insert([
          {
            name: 'demo',
            site_url: 'https://demo.example.com',
            created_at: new Date().toISOString()
          }
        ])
        .select('id, name')
        .single();

      if (brandCreateError) {
        throw new Error(`Failed to create brand: ${brandCreateError.message}`);
      }

      brandId = newBrand.id;
      console.log(`✅ Created brand "demo" with ID: ${brandId}`);
    } else if (brandCheckError) {
      throw new Error(`Error checking brand: ${brandCheckError.message}`);
    } else {
      brandId = existingBrand.id;
      console.log(`✅ Found existing brand "demo" with ID: ${brandId}`);
    }

    // Now insert the demo coupon code
    console.log('🎫 Inserting demo coupon code...');
    const { data: newCode, error: codeError } = await supabase
      .from('codes')
      .insert([
        {
          brand_id: brandId,
          code: 'WELCOME10',
          discount_text: '10% off your first order',
          terms: 'Valid until 12/31/2025',
          added_at: new Date().toISOString()
        }
      ])
      .select('id, code, discount_text, terms, added_at')
      .single();

    if (codeError) {
      throw new Error(`Failed to insert code: ${codeError.message}`);
    }

    console.log('🎉 Successfully inserted demo coupon code:');
    console.log(`   ID: ${newCode.id}`);
    console.log(`   Code: ${newCode.code}`);
    console.log(`   Discount: ${newCode.discount_text}`);
    console.log(`   Terms: ${newCode.terms}`);
    console.log(`   Added: ${newCode.added_at}`);

    // Test the API endpoint
    console.log('\n🧪 Testing API endpoint...');
    console.log('You can now test: /api/codes?brand=demo');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
insertDemoCode();
