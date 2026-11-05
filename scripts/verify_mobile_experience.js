const http = require("http");

async function checkUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, html: data });
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("=== MOBILE & RESPONSIVE VALIDATION SUITE ===");
  const pages = ["/", "/properties", "/properties/1", "/location", "/admin/login"];
  
  for (const page of pages) {
    const res = await checkUrl(page);
    console.log(`Page: ${page} -> HTTP ${res.status}`);
    if (res.status !== 200) {
      console.error(`FAIL: ${page} returned status ${res.status}`);
      process.exit(1);
    }

    // Check for invalid nested buttons inside anchors (<a ...><button ...>)
    const nestedButtonRegex = /<a[^>]*>(?:(?!<\/a>)[\s\S])*?<button/gi;
    const matches = res.html.match(nestedButtonRegex);
    if (matches && matches.length > 0) {
      console.error(`FAIL: Found ${matches.length} illegal nested <button> elements inside <a> tags on ${page}!`);
      process.exit(1);
    } else {
      console.log(`  [PASS] Zero nested <button> inside <a> tags on ${page}`);
    }
  }

  console.log("\n=== ALL PAGES PASSED VALIDATION ===");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

