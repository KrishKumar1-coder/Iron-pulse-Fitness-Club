async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/properties");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Count:", data.length);
    console.log("First item:", data[0]);
    console.log("Last item:", data[data.length - 1]);

    const hearstRes = await fetch("https://hips.hearstapps.com/hmg-prod/images/bradford-farmhouse-exterior-6659d7af95ce5.jpg", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    console.log("\nHearst direct fetch status:", hearstRes.status, hearstRes.headers.get("content-type"));
  } catch (e) {
    console.error(e);
  }
}
test();
