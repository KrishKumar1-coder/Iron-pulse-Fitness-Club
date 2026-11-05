const sharp = require('sharp');
async function findTagline() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  let minX = 9999, maxX = 0, minY = 9999, maxY = 0, count = 0;
  for (let y = 275; y <= 325; y++) {
    for (let x = 350; x <= 1400; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 95) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        count++;
      }
    }
  }
  console.log('Tagline bounds:', { minX, maxX, minY, maxY, count });
}
findTagline();
