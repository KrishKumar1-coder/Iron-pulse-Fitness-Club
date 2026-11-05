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
  console.error('Test execution aborted safely.\n');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('\n[FATAL ERROR] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  console.error('Please configure them in your environment or in .env.local.');
  process.exit(1);
}

async function runE2E() {
  console.log("=== AURELIA ESTATES FULL E2E AUDIT & VERIFICATION ===");
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, name) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------
  // TEST 1: Public property endpoints
  // ---------------------------------------------------------
  console.log("\n--- 1. Testing Public Property Endpoints ---");
  const publicPropsRes = await fetch(`${BASE_URL}/api/properties`);
  assert(publicPropsRes.status === 200, "GET /api/properties returns HTTP 200");
  const publicPropsData = await publicPropsRes.json();
  const propertyList = Array.isArray(publicPropsData) ? publicPropsData : (publicPropsData.properties || []);
  assert(propertyList.length >= 6, 
    `GET /api/properties returned ${propertyList.length} properties`);

  const publicProp1Res = await fetch(`${BASE_URL}/api/properties/1`);
  assert(publicProp1Res.status === 200, "GET /api/properties/1 returns HTTP 200");
  const publicProp1Data = await publicProp1Res.json();
  const prop1 = publicProp1Data.property || publicProp1Data;
  assert(prop1?.title === "The Glass Pavilion", 
    `GET /api/properties/1 title is "${prop1?.title}"`);

  // ---------------------------------------------------------
  // TEST 2: Security & Authorization (Unauthorized Access Blocked)
  // ---------------------------------------------------------
  console.log("\n--- 2. Testing Security & Unauthorized Access Restrictions ---");
  const unauthPost = await fetch(`${BASE_URL}/api/admin/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hacker Villa" })
  });
  assert(unauthPost.status === 401, "Anonymous POST /api/admin/properties returns 401 Unauthorized");

  const unauthPatch = await fetch(`${BASE_URL}/api/admin/properties/1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hacked Title" })
  });
  assert(unauthPatch.status === 401, "Anonymous PATCH /api/admin/properties/1 returns 401 Unauthorized");

  const unauthDelete = await fetch(`${BASE_URL}/api/admin/properties/1`, {
    method: "DELETE"
  });
  assert(unauthDelete.status === 401, "Anonymous DELETE /api/admin/properties/1 returns 401 Unauthorized");

  const unauthUpload = await fetch(`${BASE_URL}/api/admin/properties/upload`, {
    method: "POST"
  });
  assert(unauthUpload.status === 401, "Anonymous POST /api/admin/properties/upload returns 401 Unauthorized");

  // Direct anonymous attempt to write directly into Supabase Storage
  const directAnonStorage = await fetch(`${SUPABASE_URL}/storage/v1/object/property-images/unauthorized_probe.txt`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "text/plain"
    },
    body: "Malicious probe"
  });
  assert(directAnonStorage.status >= 400, 
    `Direct anon write to Supabase Storage bucket blocked with status ${directAnonStorage.status}`);

  // ---------------------------------------------------------
  // TEST 3: Admin Authentication & Session
  // ---------------------------------------------------------
  console.log("\n--- 3. Testing Admin Authentication ---");
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  });
  assert(loginRes.status === 200, "POST /api/admin/login returns HTTP 200");
  const loginData = await loginRes.json();
  const adminToken = loginData.session?.access_token;
  assert(typeof adminToken === "string" && adminToken.length > 20, "Admin obtains valid session access_token");

  // ---------------------------------------------------------
  // TEST 4: Admin Image Upload to Supabase Storage
  // ---------------------------------------------------------
  console.log("\n--- 4. Testing Admin Image Upload to Supabase Storage ---");
  // 1x1 transparent PNG binary
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const formData = new FormData();
  const blob = new Blob([samplePngBuffer], { type: "image/png" });
  formData.append("file", blob, "test_luxury_villa_facade.png");

  const uploadRes = await fetch(`${BASE_URL}/api/admin/properties/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${adminToken}`
    },
    body: formData
  });
  assert(uploadRes.status === 200, "Admin POST /api/admin/properties/upload returns HTTP 200");
  const uploadData = await uploadRes.json();
  assert(uploadData.url && uploadData.url.includes("property-images"), 
    `Image uploaded to bucket: ${uploadData.url}`);

  // Verify public read access of uploaded image
  const imagePublicRes = await fetch(uploadData.url);
  assert(imagePublicRes.status === 200, "Public HTTP GET to uploaded Supabase Storage image returns 200 OK");
  const uploadedImageUrl = uploadData.url;

  // ---------------------------------------------------------
  // TEST 5: Admin Adds New Property to Supabase
  // ---------------------------------------------------------
  console.log("\n--- 5. Testing Admin Property Creation in Supabase ---");
  const newPropPayload = {
    title: "E2E Automated Penthouse Test",
    location: "Beverly Hills, CA",
    locationKey: "Beverly Hills, CA",
    type: "Penthouse",
    price: "$29,500,000",
    priceValue: 29500000,
    beds: 5,
    baths: 6.5,
    sqft: "11,200",
    badge: "Exclusive",
    status: "For Sale",
    description: "An extraordinary modern architectural triumph created during E2E verification.",
    images: [uploadedImageUrl],
    floorPlanUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    virtualTourUrl: "https://my.matterport.com/show/?m=test"
  };

  const createPropRes = await fetch(`${BASE_URL}/api/admin/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify(newPropPayload)
  });
  assert(createPropRes.status === 201, "Admin POST /api/admin/properties returns HTTP 201 Created");
  const createPropData = await createPropRes.json();
  const createdPropertyId = createPropData.property?.id;
  assert(typeof createdPropertyId === "number", `Created property assigned ID #${createdPropertyId}`);

  // ---------------------------------------------------------
  // TEST 6: Verify New Property is Live in Public & Admin
  // ---------------------------------------------------------
  console.log("\n--- 6. Verifying New Property in Public API & Admin ---");
  const getCreatedPropRes = await fetch(`${BASE_URL}/api/properties/${createdPropertyId}`);
  assert(getCreatedPropRes.status === 200, `GET /api/properties/${createdPropertyId} returns HTTP 200`);
  const getCreatedData = await getCreatedPropRes.json();
  const createdProp = getCreatedData.property || getCreatedData;
  assert(createdProp?.title === newPropPayload.title, 
    `Verified live title: "${createdProp?.title}"`);
  assert(createdProp?.images?.[0] === uploadedImageUrl, 
    `Verified live cover image is the Supabase Storage URL`);

  // ---------------------------------------------------------
  // TEST 7: Admin Edits Existing Property
  // ---------------------------------------------------------
  console.log("\n--- 7. Testing Admin Property Update (Edit) ---");
  const updatePayload = {
    title: "E2E Updated Grand Penthouse",
    price: "$32,000,000",
    priceValue: 32000000,
    status: "Under Contract",
    badge: "Trophy Asset"
  };

  const patchRes = await fetch(`${BASE_URL}/api/admin/properties/${createdPropertyId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify(updatePayload)
  });
  assert(patchRes.status === 200, `PATCH /api/admin/properties/${createdPropertyId} returns HTTP 200`);
  const patchData = await patchRes.json();
  assert(patchData.property?.title === "E2E Updated Grand Penthouse", 
    `Updated title saved as: "${patchData.property?.title}"`);
  assert(patchData.property?.price === "$32,000,000", 
    `Updated price saved as: "${patchData.property?.price}"`);

  // Verify public API reflects the update
  const verifyUpdatedRes = await fetch(`${BASE_URL}/api/properties/${createdPropertyId}`);
  const verifyUpdatedData = await verifyUpdatedRes.json();
  const updatedProp = verifyUpdatedData.property || verifyUpdatedData;
  assert(updatedProp?.title === "E2E Updated Grand Penthouse", 
    "Public API immediately reflects the updated property title");

  // ---------------------------------------------------------
  // TEST 8: Admin Deletes Property & Cleans Up Storage Image
  // ---------------------------------------------------------
  console.log("\n--- 8. Testing Admin Property Deletion & Storage Cleanup ---");
  const deletePropRes = await fetch(`${BASE_URL}/api/admin/properties/${createdPropertyId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${adminToken}`
    }
  });
  assert(deletePropRes.status === 200, `DELETE /api/admin/properties/${createdPropertyId} returns HTTP 200`);

  // Verify deletion from public API
  const getDeletedRes = await fetch(`${BASE_URL}/api/properties/${createdPropertyId}`);
  assert(getDeletedRes.status === 404, `GET /api/properties/${createdPropertyId} now returns 404 Not Found`);

  // Clean up uploaded image from Supabase Storage
  const deleteImageRes = await fetch(`${BASE_URL}/api/admin/properties/upload`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ url: uploadedImageUrl })
  });
  assert(deleteImageRes.status === 200, "DELETE /api/admin/properties/upload cleans up test image from storage");

  // ---------------------------------------------------------
  // TEST 9: Public Forms & Existing Lead/Tour Operations
  // ---------------------------------------------------------
  console.log("\n--- 9. Verifying Public Forms (Leads & Tour Bookings) Integrity ---");
  const testLeadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Audit Test VIP Client",
      email: "audit.test@aurelia.com",
      phone: "+1 310 555 0199",
      property_title: "The Glass Pavilion",
      notes: "E2E test inquiry for integrity verification."
    })
  });
  assert(testLeadRes.status === 201, "Public POST /api/leads succeeds with HTTP 201");
  const leadData = await testLeadRes.json();
  const createdLeadId = leadData.lead?.id;

  const testTourRes = await fetch(`${BASE_URL}/api/tour-bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Audit Test Tour Client",
      email: "audit.tour@aurelia.com",
      phone: "+1 310 555 0198",
      property_title: "The Glass Pavilion",
      preferred_date: "2026-11-01",
      preferred_time: "14:00",
      special_requests: "Chauffeured arrival."
    })
  });
  assert(testTourRes.status === 201, "Public POST /api/tour-bookings succeeds with HTTP 201");
  const tourData = await testTourRes.json();
  const createdTourId = tourData.booking?.id;

  // Clean up test lead and tour booking using admin delete
  if (createdLeadId) {
    const delLead = await fetch(`${BASE_URL}/api/admin/leads/${createdLeadId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    assert(delLead.status === 200, `Admin successfully cleaned up test lead #${createdLeadId}`);
  }
  if (createdTourId) {
    const delTour = await fetch(`${BASE_URL}/api/admin/tour-bookings/${createdTourId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    assert(delTour.status === 200, `Admin successfully cleaned up test tour booking #${createdTourId}`);
  }

  // ---------------------------------------------------------
  // Summary
  // ---------------------------------------------------------
  console.log("\n========================================================");
  console.log(`E2E AUDIT RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("========================================================\n");

  if (passedTests === totalTests) {
    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } else {
    throw new Error(`Only ${passedTests} of ${totalTests} passed.`);
  }
}

runE2E().catch((err) => {
  console.error("FATAL E2E ERROR:", err);
  process.exit(1);
});
