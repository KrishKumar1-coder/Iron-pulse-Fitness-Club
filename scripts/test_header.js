const sharp = require('sharp');
async function testHeaderSegmentation() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Let's create an image showing exactly what is detected as foreground vs background in y < 340
  const out = Buffer.alloc(w * 340 * 3);

  for (let y = 0; y < 340; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const warm = r - b;

      // Gold elements (Roof, horizontal lines, ESTATES letters):
      const isGold = (sat >= 18 && warm >= 18 && r >= 110);

      // Roof windows (inside gable, 4 small blue rectangles):
      const isWindow = (x >= 840 && x <= 930 && y >= 105 && y <= 158 && (b >= r + 5 || (lum < 90 && sat > 5)));

      // AURELIA letters (x ~ 220 to 915, y ~ 168 to 268):
      const isAurelia = (x >= 220 && x <= 915 && y >= 168 && y <= 268 && (lum < 95 || b >= r + 2));

      // Tagline letters (x ~ 380 to 1350, y ~ 280 to 318):
      const isTagline = (x >= 380 && x <= 1350 && y >= 280 && y <= 318 && (lum < 100 || b >= r + 2));

      const isForeground = isGold || isWindow || isAurelia || isTagline;

      const outIdx = (y * w + x) * 3;
      if (isForeground) {
        out[outIdx] = r;
        out[outIdx+1] = g;
        out[outIdx+2] = b;
      } else {
        // Background -> bright magenta to make any error instantly visible!
        out[outIdx] = 255;
        out[outIdx+1] = 0;
        out[outIdx+2] = 255;
      }
    }
  }

  await sharp(out, { raw: { width: w, height: 340, channels: 3 } })
    .png()
    .toFile('c:/real estate/luxury-real-estate/public/test_header_magenta.png');
  console.log('Saved test_header_magenta.png');
}
testHeaderSegmentation();
