const sharp = require('sharp');
async function findEstates() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  let minX = 9999, maxX = 0, minY = 9999, maxY = 0, count = 0;
  for (let y = 168; y <= 265; y++) {
    for (let x = 850; x <= 1500; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const warm = r - b;
      if (sat >= 20 && warm >= 20 && r >= 130) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        count++;
      }
    }
  }
  console.log('ESTATES gold bounds:', { minX, maxX, minY, maxY, count });
}
findEstates();
