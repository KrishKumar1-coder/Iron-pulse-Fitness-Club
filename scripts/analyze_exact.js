const sharp = require('sharp');
async function testOuter() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  
  // Test along all 4 outer edges:
  let maxBorderSat = 0;
  for (let x = 0; x < w; x++) {
    const idx0 = (0 * w + x) * 3;
    const sat0 = Math.max(data[idx0], data[idx0+1], data[idx0+2]) - Math.min(data[idx0], data[idx0+1], data[idx0+2]);
    if (sat0 > maxBorderSat) maxBorderSat = sat0;
  }
  for (let y = 0; y < h; y++) {
    const idxL = (y * w + 0) * 3;
    const idxR = (y * w + (w - 1)) * 3;
    const satL = Math.max(data[idxL], data[idxL+1], data[idxL+2]) - Math.min(data[idxL], data[idxL+1], data[idxL+2]);
    const satR = Math.max(data[idxR], data[idxR+1], data[idxR+2]) - Math.min(data[idxR], data[idxR+1], data[idxR+2]);
    if (satL > maxBorderSat) maxBorderSat = satL;
    if (satR > maxBorderSat) maxBorderSat = satR;
  }
  console.log('Max border saturation along top, left, right edges:', maxBorderSat);
}
testOuter();
