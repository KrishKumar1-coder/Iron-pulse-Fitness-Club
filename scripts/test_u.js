const sharp = require('sharp');
async function findUStrokes() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  // Scan horizontally across x=300 to 450 at y=210
  console.log('Horizontal scan at y=210 for letter U:');
  for (let x = 320; x <= 430; x += 5) {
    const idx = (210 * w + x) * 3;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    console.log('x=' + x + ': RGB(' + r + ',' + g + ',' + b + '), lum=' + Math.round(lum) + ', sat=' + sat);
  }
}
findUStrokes();
