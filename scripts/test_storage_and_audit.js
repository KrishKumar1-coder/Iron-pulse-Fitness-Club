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

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("=== COMPREHENSIVE STORAGE AUDIT & PROPERTY VERIFICATION ===");
  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. Verify Public Image Loading for ALL 6 Existing Properties
  console.log("\n--- 1. Verifying Migrated Existing Property Images ---");
  const propsRes = await fetch(`${BASE_URL}/api/properties`);
  assert(propsRes.status === 200, "GET /api/properties returns 200 OK");
  const props = await propsRes.json();
  const propertyList = Array.isArray(props) ? props : props.properties;
  assert(propertyList.length >= 6, `Found ${propertyList.length} properties in database`);

  const uniqueImageUrls = new Set();
  for (const p of propertyList.slice(0, 6)) {
    assert(p.images && p.images.length > 0, `Property #${p.id} (${p.title}) has ${p.images.length} images`);
    for (const imgUrl of p.images) {
      assert(imgUrl.includes("/property-images/"), `Property #${p.id} image is in Supabase Storage: ${imgUrl}`);
      uniqueImageUrls.add(imgUrl);
    }
  }

  console.log(`\nVerifying HTTP 200 on all ${uniqueImageUrls.size} unique Supabase Storage URLs...`);
  for (const url of uniqueImageUrls) {
    const imgRes = await fetch(url);
    const contentType = imgRes.headers.get("content-type") || "";
    assert(imgRes.status === 200 && contentType.startsWith("image/"), 
      `Public image loads: ${url.split("/").pop()} (${imgRes.status} ${contentType})`);
  }

  // 2. Storage Bucket Security & RLS Policy Verification (Listing Restricted)
  console.log("\n--- 2. Verifying File Listing Restriction (Broad SELECT Policy Fixed) ---");
  // Anonymous attempt to list files in bucket
  const anonListRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/property-images`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefix: "", limit: 100 })
  });
  const anonListData = await anonListRes.json();
  // With RLS SELECT restricted to admin, anon listing receives empty array or error
  const isAnonListingBlocked = !Array.isArray(anonListData) || anonListData.length === 0;
  assert(isAnonListingBlocked, 
    `Anonymous file listing blocked by RLS policy (Returned: ${JSON.stringify(anonListData).slice(0, 60)})`);

  // Direct anonymous attempt to upload or delete
  const anonUploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/property-images/probe.txt`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "text/plain"
    },
    body: "Unauthorized write"
  });
  assert(anonUploadRes.status >= 400, `Anonymous direct write blocked: status ${anonUploadRes.status}`);

  // 3. Admin Authentication & Admin File Listing
  console.log("\n--- 3. Verifying Admin Authentication & Authorized Listing ---");
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.88" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  assert(loginRes.status === 200, "Admin login successful");
  const loginData = await loginRes.json();
  const adminToken = loginData.session?.access_token;
  assert(typeof adminToken === "string" && adminToken.length > 20, "Admin session token acquired");

  // Admin listing files in bucket
  const adminListRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/property-images`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefix: "", limit: 100 })
  });
  const adminListData = await adminListRes.json();
  assert(Array.isArray(adminListData) && adminListData.length >= 14, 
    `Admin successfully lists files (${adminListData.length} objects visible to admin)`);

  // 4. Admin Add New Property, Upload/Replace Image, and Delete
  console.log("\n--- 4. Verifying Admin Property Lifecycle (Add, Upload, Edit, Delete) ---");
  // Upload a fresh test image
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const formData = new FormData();
  const blob = new Blob([samplePngBuffer], { type: "image/png" });
  formData.append("file", blob, "lifecycle_test_cover.png");

  const uploadRes = await fetch(`${BASE_URL}/api/admin/properties/upload`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${adminToken}` },
    body: formData
  });
  assert(uploadRes.status === 200, "Admin uploads new estate image via upload route");
  const uploadData = await uploadRes.json();
  const newImageUrl = uploadData.url;
  assert(newImageUrl && newImageUrl.includes("/property-images/"), `Image stored in Supabase: ${newImageUrl}`);

  // Add new property
  const createRes = await fetch(`${BASE_URL}/api/admin/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: "Audited Modern Sanctuary",
      location: "Beverly Hills, CA",
      locationKey: "Beverly Hills, CA",
      type: "Villa",
      price: "$21,500,000",
      priceValue: 21500000,
      beds: 5,
      baths: 6,
      sqft: "9,400",
      badge: "Exclusive",
      status: "Available",
      description: "A newly curated estate verified during comprehensive audit.",
      images: [newImageUrl]
    })
  });
  assert(createRes.status === 201, "Admin creates new property listing");
  const createData = await createRes.json();
  const createdId = createData.property?.id;
  assert(typeof createdId === "number", `Created property assigned ID #${createdId}`);

  // Verify public retrieval of newly created property
  const getNewRes = await fetch(`${BASE_URL}/api/properties/${createdId}`);
  assert(getNewRes.status === 200, `GET /api/properties/${createdId} returns 200 OK`);
  const getNewData = await getNewRes.json();
  const newPropObj = getNewData.property || getNewData;
  assert(newPropObj?.title === "Audited Modern Sanctuary", "Public endpoint returns exact title");
  assert(newPropObj?.images?.[0] === newImageUrl, "Public endpoint returns exact Supabase Storage image URL");

  // Edit/Replace Property (Add second image from migrated set, update price)
  const existingMigratedUrl = Array.from(uniqueImageUrls)[0];
  const editRes = await fetch(`${BASE_URL}/api/admin/properties/${createdId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      price: "$23,000,000",
      priceValue: 23000000,
      images: [newImageUrl, existingMigratedUrl] // Replaced/appended media
    })
  });
  assert(editRes.status === 200, `Admin edits property #${createdId}`);
  const editData = await editRes.json();
  assert(editData.property?.price === "$23,000,000", "Price updated to $23,000,000");
  assert(editData.property?.images?.length === 2, "Images array updated with 2 images");

  // Delete Property
  const deleteRes = await fetch(`${BASE_URL}/api/admin/properties/${createdId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  assert(deleteRes.status === 200, `Admin deletes property #${createdId}`);

  // Clean up uploaded test image
  const deleteImageRes = await fetch(`${BASE_URL}/api/admin/properties/upload`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ url: newImageUrl })
  });
  assert(deleteImageRes.status === 200, "Cleaned up test image from storage bucket");

  // 5. Existing Public Detail Pages Verification
  console.log("\n--- 5. Verifying Existing Public Detail Pages (1-6) ---");
  for (let i = 1; i <= 6; i++) {
    const pageRes = await fetch(`${BASE_URL}/api/properties/${i}`);
    assert(pageRes.status === 200, `GET /api/properties/${i} returns 200`);
    const pageData = await pageRes.json();
    const p = pageData.property || pageData;
    assert(p && p.images && p.images[0].includes("property-images"), 
      `Property #${i} (${p?.title}) primary image is Supabase Storage URL`);
  }

  console.log("\n========================================================");
  console.log(`AUDIT & VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log("========================================================\n");

  if (passed === total) {
    console.log("ALL REQUIREMENTS VERIFIED 100% WORKING!");
  } else {
    throw new Error(`Only ${passed} of ${total} tests passed.`);
  }
}

runAudit().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
