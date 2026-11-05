const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Safely load environment variables from .env.local without fallback credentials
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('\n[FATAL ERROR] ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  console.error('Please configure them in your environment or in .env.local.');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('\n[FATAL ERROR] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  console.error('Please configure them in your environment or in .env.local.');
  process.exit(1);
}

async function migrateProp12() {
  console.log("=== MIGRATING PROPERTY 12 EXTERNAL IMAGE ===");
  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  const loginData = await loginRes.json();
  const token = loginData.session?.access_token;

  // 2. Download Hearst image
  const hearstUrl = "https://hips.hearstapps.com/hmg-prod/images/bradford-farmhouse-exterior-6659d7af95ce5.jpg";
  console.log("Downloading image from Hearst...");
  const dlRes = await fetch(hearstUrl, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const buf = Buffer.from(await dlRes.arrayBuffer());
  const filename = "prop-12-bradford-farmhouse.jpg";

  // 3. Upload to Supabase Storage
  console.log(`Uploading ${buf.length} bytes to Supabase Storage...`);
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/property-images/${filename}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "true"
    },
    body: buf
  });
  console.log("Upload status:", uploadRes.status);

  const supabaseUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${filename}`;
  console.log("New Supabase Storage URL:", supabaseUrl);

  // 4. Update property 12
  const patchRes = await fetch(`${BASE_URL}/api/admin/properties/12`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      images: [
        supabaseUrl,
        "https://sldtibqmumlfupranpbr.supabase.co/storage/v1/object/public/property-images/prop-1792906626158-ehhxqdx.png"
      ]
    })
  });
  console.log("Property 12 patch status:", patchRes.status);
  const patchData = await patchRes.json();
  console.log("Updated property 12 images:", patchData.property?.images);
}

migrateProp12().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
