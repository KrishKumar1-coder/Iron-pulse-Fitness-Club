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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getPhotoKey(url) {
  const match = url.match(/photo-[a-zA-Z0-9_-]+/);
  if (match) {
    return `${match[0]}.jpg`;
  }
  // fallback hash
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `estate-img-${Math.abs(hash)}.jpg`;
}

async function migrate() {
  console.log("=== MIGRATING ALL PROPERTY IMAGES TO SUPABASE STORAGE ===");

  // 1. Authenticate as admin
  console.log("1. Authenticating admin session...");
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const adminToken = loginData.session?.access_token;
  console.log("   Admin session verified.");

  // 2. Load existing properties from public API / data
  const propsRes = await fetch(`${BASE_URL}/api/properties`);
  const properties = await propsRes.json();
  console.log(`2. Found ${properties.length} existing properties in database.`);

  // 3. Cache uploaded mapping to avoid duplicate uploads
  const uploadedUrlMap = new Map(); // originalUrl -> supabaseUrl

  for (const prop of properties) {
    console.log(`\nProcessing Property #${prop.id}: "${prop.title}" (${prop.images?.length || 0} images)`);
    const newImageUrls = [];

    for (let i = 0; i < (prop.images || []).length; i++) {
      const origUrl = prop.images[i];

      // If already a supabase storage URL, keep it
      if (origUrl.includes("/property-images/")) {
        console.log(`  [Image ${i + 1}] Already in Supabase Storage: ${origUrl}`);
        newImageUrls.push(origUrl);
        continue;
      }

      // If already uploaded during this run (deduplication)
      if (uploadedUrlMap.has(origUrl)) {
        const cachedUrl = uploadedUrlMap.get(origUrl);
        console.log(`  [Image ${i + 1}] Reusing previously uploaded asset: ${cachedUrl}`);
        newImageUrls.push(cachedUrl);
        continue;
      }

      // Check if image already exists in storage bucket
      const filename = getPhotoKey(origUrl);
      const targetPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${filename}`;

      console.log(`  [Image ${i + 1}] Fetching original from Unsplash...`);
      const fetchImageRes = await fetch(origUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (!fetchImageRes.ok) {
        throw new Error(`Failed to download original image: ${origUrl}`);
      }
      const imageBuffer = Buffer.from(await fetchImageRes.arrayBuffer());
      const contentType = fetchImageRes.headers.get("content-type") || "image/jpeg";

      console.log(`  [Image ${i + 1}] Uploading ${imageBuffer.length} bytes as '${filename}' to Supabase Storage...`);
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/property-images/${filename}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": contentType,
          "x-upsert": "true"
        },
        body: imageBuffer
      });

      if (!uploadRes.ok && uploadRes.status !== 409) {
        const errText = await uploadRes.text();
        throw new Error(`Upload failed for ${filename}: ${uploadRes.status} ${errText}`);
      }

      // Verify public access
      const verifyRes = await fetch(targetPublicUrl);
      if (verifyRes.status !== 200) {
        throw new Error(`Uploaded image not publicly readable: ${targetPublicUrl} (Status ${verifyRes.status})`);
      }

      console.log(`  [Image ${i + 1}] Successfully migrated -> ${targetPublicUrl}`);
      uploadedUrlMap.set(origUrl, targetPublicUrl);
      newImageUrls.push(targetPublicUrl);
    }

    // Update Property in Supabase via Admin PATCH endpoint
    console.log(`  Updating Property #${prop.id} in database with new Supabase Storage URLs...`);
    const patchRes = await fetch(`${BASE_URL}/api/admin/properties/${prop.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ images: newImageUrls })
    });

    if (!patchRes.ok) {
      const patchErr = await patchRes.text();
      throw new Error(`Failed to update property #${prop.id}: ${patchErr}`);
    }
    console.log(`  Property #${prop.id} successfully updated with ${newImageUrls.length} Supabase Storage images!`);
  }

  console.log("\n========================================================");
  console.log(`MIGRATION COMPLETE: ${uploadedUrlMap.size} UNIQUE IMAGES MIGRATED TO SUPABASE STORAGE`);
  console.log("========================================================\n");

  return uploadedUrlMap;
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("MIGRATION FAILED:", err);
    process.exit(1);
  });
