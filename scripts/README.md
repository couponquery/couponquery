# Scripts

This directory contains utility scripts for managing the coupon query application.

## insert_demo_code.js

Inserts a sample coupon code for the "demo" brand in Supabase.

### Prerequisites

1. Set up environment variables:
   ```bash
   export SUPABASE_URL="your_supabase_url"
   export SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Usage

```bash
node scripts/insert_demo_code.js
```

### What it does

1. Checks if "demo" brand exists in the `brands` table
2. Creates the "demo" brand if it doesn't exist
3. Inserts a sample coupon code:
   - Code: "WELCOME10"
   - Discount: "10% off your first order"
   - Terms: "Valid until 12/31/2025"
4. Provides confirmation and testing instructions

After running this script, you can test the API endpoint:
- `/.netlify/functions/codes?brand=demo`
- `/api/codes?brand=demo`
