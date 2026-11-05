const sharp = require('sharp');
async function findGoldBars() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  
  // Upper horizontal bar under the roof: around y ~ 165 to 175
  let minX1 = 9999, maxX1 = 0;
  for (let y = 162; y <= 175; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > 20 && r - b > 25 && r > 130) {
        minX1 = Math.min(minX1, x);
        maxX1 = Math.max(maxX1, x);
      }
    }
  }
  console.log('Upper gold bar:', { minX1, maxX1 });

  // Lower accent bars on either side of tagline: around y ~ 295 to 308
  let minXLeft = 9999, maxXLeft = 0, minXRight = 9999, maxXRight = 0;
  for (let y = 295; y <= 312; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > 20 && r - b > 25 && r > 130) {
        if (x < 500) {
          minXLeft = Math.min(minXLeft, x);
          maxXLeft = Math.max(maxXLeft, x);
        } else if (x > 1200) {
          minXRight = Math.min(minXRight, x);
          maxXRight = Math.max(maxXRight, x);
        }
      }
    }
  }
  console.log('Lower accent bars: Left:', { minXLeft, maxXLeft }, 'Right:', { minXRight, maxXRight });
}
findGoldBars();
