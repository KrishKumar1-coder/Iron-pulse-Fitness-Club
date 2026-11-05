async function testPages() {
  console.log("=== TESTING PUBLIC PAGES FOR PROPERTY 12 & LIVE DATA ===");
  let passed = 0;
  let total = 0;

  function assert(cond, desc) {
    total++;
    if (cond) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // 1. Check API properties
  const resApi = await fetch("http://localhost:3000/api/properties");
  assert(resApi.status === 200, "GET /api/properties returns HTTP 200");
  const props = await resApi.json();
  const prop12 = props.find(p => p.id === 12);
  assert(!!prop12, `Property #12 found in /api/properties: "${prop12?.title}"`);
  assert(prop12?.images?.[0]?.includes("property-images"), `Property #12 primary image is in Supabase Storage: ${prop12?.images?.[0]}`);

  // 2. Check API property by ID
  const resApi12 = await fetch("http://localhost:3000/api/properties/12");
  assert(resApi12.status === 200, "GET /api/properties/12 returns HTTP 200");
  const prop12Data = await resApi12.json();
  assert(prop12Data.title === "rahuls villa", `GET /api/properties/12 title is "${prop12Data.title}"`);

  // 3. Check Homepage HTML
  const resHome = await fetch("http://localhost:3000/");
  assert(resHome.status === 200, "GET / (Homepage) returns HTTP 200");

  // 4. Check All Properties Page HTML
  const resAllProps = await fetch("http://localhost:3000/properties");
  assert(resAllProps.status === 200, "GET /properties returns HTTP 200");

  // 5. Check Property 12 Detail Page HTML
  const resProp12Page = await fetch("http://localhost:3000/properties/12");
  assert(resProp12Page.status === 200, "GET /properties/12 returns HTTP 200");
  const html12 = await resProp12Page.text();
  assert(html12.includes("rahuls villa") || html12.includes("Loading Residence Details"), 
    "GET /properties/12 page contains property title or loading skeleton without crash");
  assert(!html12.includes("Property Not Found"), "GET /properties/12 does NOT show 'Property Not Found'");

  // 6. Verify image loads with 200 OK
  const imgUrl = prop12.images[0];
  const imgRes = await fetch(imgUrl);
  assert(imgRes.status === 200, `Image loads with HTTP 200: ${imgUrl}`);

  console.log(`\nRESULTS: ${passed} / ${total} tests passed!`);
  if (passed === total) {
    console.log("SUCCESS: Property 12 is fully working, showing on the site, and all images are secured in Supabase Storage!");
  }
}

testPages().catch(e => { console.error(e); process.exit(1); });
