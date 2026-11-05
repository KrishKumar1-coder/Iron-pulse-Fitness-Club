const sharp = require('sharp');
async function testRoofGold() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  // Scan roof beam pixels around x=800, y from 60 to 100
  console.log('Roof beam pixels at x=800:');
  for (let y = 65; y <= 95; y += 3) {
    const idx = (y * w + 800) * 3;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    console.log('y=' + y + ': RGB(' + r + ',' + g + ',' + b + '), sat=' + sat + ', warm=' + (r - b));
  }
}
testRoofGold();
