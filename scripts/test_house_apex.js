const sharp = require('sharp');
async function findHouseRoofApex() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  // Find topmost pixel of the house roof (center x around 865)
  for (let y = 330; y <= 375; y++) {
    for (let x = 800; x <= 940; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // House roof is dark grey slate tile: lum < 80
      if (lum < 80) {
        console.log('Top of house roof found at x=' + x + ', y=' + y + ': RGB(' + r + ',' + g + ',' + b + '), lum=' + Math.round(lum));
        return;
      }
    }
  }
}
findHouseRoofApex();
