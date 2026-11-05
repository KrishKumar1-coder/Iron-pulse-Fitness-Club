const sharp = require('sharp');
async function scanLetters() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  // Count dark pixels per column in y from 165 to 265
  const colCounts = [];
  for (let x = 350; x <= 1400; x++) {
    let count = 0;
    for (let y = 168; y <= 265; y++) {
      const idx = (y * w + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 95) count++;
    }
    if (count > 0) {
      colCounts.push({ x, count });
    }
  }
  
  // Print spans of text:
  let inSpan = false, startX = 0, spanPixels = 0;
  for (let x = 350; x <= 1400; x++) {
    const item = colCounts.find(c => c.x === x);
    const hasPixels = item && item.count > 0;
    if (hasPixels && !inSpan) {
      inSpan = true;
      startX = x;
      spanPixels = item.count;
    } else if (hasPixels && inSpan) {
      spanPixels += item.count;
    } else if (!hasPixels && inSpan) {
      inSpan = false;
      console.log('Span from x=' + startX + ' to ' + (x - 1) + ', total dark pixels=' + spanPixels);
    }
  }
}
scanLetters();
