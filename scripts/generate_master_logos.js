const sharp = require('sharp');
const fs = require('fs');

async function generateMasterLogos() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // STEP 1: Accurate Classification of Background vs Foreground
  // A binary mask: 0 = foreground, 1 = background
  const bgMask = new Uint8Array(w * h);

  // Helper: check if a pixel in header (y < 340) is background
  function isHeaderBackground(x, y, r, g, b, sat, lum, warm) {
    // 1. Outside horizontal bounds of the header graphic:
    if (x < 390 || x > 1365) return true;

    // 2. Above the roof:
    // Roof apex: (878, 34). Slants down to (660, 168) on left, (1085, 168) on right.
    if (y < 168) {
      // Chimney: x in [940..975], y in [60..140]
      const inChimney = (x >= 940 && x <= 975 && y >= 60 && y <= 140 && (sat > 15 || lum < 100));
      // Roof windows: 4 squares at x in [852..904], y in [112..154]
      const inWindow = (x >= 852 && x <= 904 && y >= 112 && y <= 154 && (b >= r + 3 || lum < 85));
      // Left slant equation: y - 34 = (168 - 34)/(660 - 878) * (x - 878) => y = 34 - 0.615 * (x - 878)
      // Right slant equation: y - 34 = (168 - 34)/(1085 - 878) * (x - 878) => y = 34 + 0.647 * (x - 878)
      const roofY = (x <= 878) ? (34 - 0.615 * (x - 878)) : (34 + 0.647 * (x - 878));

      // Above roof beam:
      if (y < roofY - 5) return true;

      // Inside gable (between roof beam and horizontal bar at y=168):
      if (y > roofY + 12 && y < 165) {
        if (!inChimney && !inWindow) {
          // It's the gable background checkerboard!
          return true;
        }
      }
    }

    // 3. Between header bottom and house roof (y between 318 and 355):
    if (y >= 318 && y <= 350) return true;

    // 4. In text region (y in [165..318], x in [390..1365]):
    // Is it a gold element? (Roof bar, ESTATES, accent bars)
    const isGold = (sat >= 18 && warm >= 18 && r >= 110);
    if (isGold) return false;

    // Is it dark text? (AURELIA letters, tagline letters)
    // AURELIA letters: x in [392..848], y in [168..268]
    const isAurelia = (x >= 392 && x <= 848 && y >= 168 && y <= 268 && (lum < 98 || (sat > 10 && b > r)));
    if (isAurelia) return false;

    // Tagline: x in [384..1348], y in [275..318]
    const isTagline = (x >= 384 && x <= 1348 && y >= 275 && y <= 318 && (lum < 100 || (sat > 10 && b > r)));
    if (isTagline) return false;

    // Roof windows:
    const isWindow = (x >= 852 && x <= 904 && y >= 112 && y <= 154 && (b >= r + 3 || lum < 85));
    if (isWindow) return false;

    // Anything else in the header is checkerboard!
    return true;
  }

  // Populate header background mask
  for (let y = 0; y < 340; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3;
      const pIdx = y * w + x;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const warm = r - b;
      if (isHeaderBackground(x, y, r, g, b, sat, lum, warm)) {
        bgMask[pIdx] = 1;
      }
    }
  }

  // STEP 2: Flood fill from image borders for hands and house region (y >= 335)
  // BFS queue
  const queue = new Int32Array(w * h * 2);
  let qHead = 0, qTail = 0;

  function pushQueue(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const pIdx = y * w + x;
    if (bgMask[pIdx] === 1) return;

    const sIdx = pIdx * 3;
    const r = data[sIdx], g = data[sIdx+1], b = data[sIdx+2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const warm = r - b;

    // Checkerboard pixel condition for lower region (house & hands):
    // Neutral grey or white: sat <= 14, lum >= 110
    // OR soft shadow: sat <= 10, lum >= 95
    // Note: Skin is warm (warm > 35, sat > 35), trees are green (sat > 25), house is cream (warm > 18)
    const isCb = (sat <= 14 && lum >= 105 && warm <= 14) || (sat <= 9 && lum >= 90 && warm <= 9);

    if (isCb) {
      bgMask[pIdx] = 1;
      queue[qTail++] = x;
      queue[qTail++] = y;
    }
  }

  // Seed flood fill along left and right edges for y >= 335
  for (let y = 335; y < h; y++) {
    pushQueue(0, y);
    pushQueue(1, y);
    pushQueue(w - 2, y);
    pushQueue(w - 1, y);
  }

  // Seed flood fill along bottom edge (includes gap between wrists at x in [800..930])
  for (let x = 0; x < w; x++) {
    pushQueue(x, h - 1);
    pushQueue(x, h - 2);
  }

  // Seed flood fill from the transition row y = 338 where header background connects to lower region
  for (let x = 0; x < w; x++) {
    if (bgMask[338 * w + x] === 1) {
      pushQueue(x, 339);
      pushQueue(x, 340);
      pushQueue(x, 341);
    }
  }

  // Run BFS
  while (qHead < qTail) {
    const cx = queue[qHead++];
    const cy = queue[qHead++];
    pushQueue(cx + 1, cy);
    pushQueue(cx - 1, cy);
    pushQueue(cx, cy + 1);
    pushQueue(cx, cy - 1);
  }

  console.log('Total background pixels detected:', qTail / 2 + ' + header');

  // STEP 3: Subpixel Alpha Matting & Edge De-haloing
  // For each pixel:
  // If bgMask == 1 => alpha = 0
  // If bgMask == 0:
  // Check neighbors to detect boundary transition pixels.
  // If pixel has background neighbors, calculate smooth antialiased alpha and de-halo color!
  const alphaMap = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pIdx = y * w + x;
      if (bgMask[pIdx] === 1) {
        alphaMap[pIdx] = 0;
        continue;
      }

      // Count distance to background
      let bgCount = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || bgMask[ny * w + nx] === 1) {
            bgCount++;
          }
        }
      }

      if (bgCount === 0) {
        alphaMap[pIdx] = 255;
      } else {
        // Smooth fractional alpha
        const sIdx = pIdx * 3;
        const r = data[sIdx], g = data[sIdx+1], b = data[sIdx+2];
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Background squares average lum is around 225 (white) or 195 (grey)
        // If lum is high and sat is low, it has more background contribution
        let aFactor = 1.0 - (bgCount / 12);
        if (sat < 15 && lum > 140) {
          const bgProportion = Math.min(1, Math.max(0, (lum - 100) / 120));
          aFactor *= (1.0 - bgProportion * 0.7);
        }
        alphaMap[pIdx] = Math.max(30, Math.min(255, Math.round(aFactor * 255)));
      }
    }
  }

  // STEP 4: Render Master Outputs
  // Version 1: Original authentic colors (with crisp de-haloing)
  // Version 2: Rich 3D Gold AURELIA (matches ESTATES 100%)
  // Version 3: Luminous Platinum White AURELIA (matches Navbar & Intro 2 aesthetic)
  const bufOrig = Buffer.alloc(w * h * 4);
  const bufGold = Buffer.alloc(w * h * 4);
  const bufWhite = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pIdx = y * w + x;
      const sIdx = pIdx * 3;
      const oIdx = pIdx * 4;
      const alpha = alphaMap[pIdx];

      if (alpha === 0) {
        continue;
      }

      const r = data[sIdx], g = data[sIdx+1], b = data[sIdx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Identify text elements for enhancement
      const isAureliaLetter = (x >= 392 && x <= 848 && y >= 168 && y <= 268 && bgMask[pIdx] === 0);
      const isTaglineLetter = (x >= 384 && x <= 1348 && y >= 275 && y <= 318 && bgMask[pIdx] === 0 && lum < 105);

      // Version 1: Original
      bufOrig[oIdx] = r;
      bufOrig[oIdx+1] = g;
      bufOrig[oIdx+2] = b;
      bufOrig[oIdx+3] = alpha;

      // Version 2: Unified 3D Gold
      if (isAureliaLetter) {
        // Luminance of original AURELIA is roughly 15 (deep shadow) to 75 (bevel highlight)
        // Map smoothly to ESTATES gold palette:
        // Deep shadow: [160, 110, 48]
        // Midtone: [225, 180, 105]
        // Bright highlight: [255, 235, 175]
        const t = Math.max(0, Math.min(1, lum / 65));
        bufGold[oIdx] = Math.round(160 * (1 - t) + 255 * t);
        bufGold[oIdx+1] = Math.round(110 * (1 - t) + 230 * t);
        bufGold[oIdx+2] = Math.round(48 * (1 - t) + 165 * t);
        bufGold[oIdx+3] = alpha;
      } else if (isTaglineLetter) {
        // Tagline gold: crisp warm gold
        const t = Math.max(0, Math.min(1, lum / 60));
        bufGold[oIdx] = Math.round(230 + 25 * t);
        bufGold[oIdx+1] = Math.round(190 + 35 * t);
        bufGold[oIdx+2] = Math.round(125 + 35 * t);
        bufGold[oIdx+3] = alpha;
      } else {
        bufGold[oIdx] = r;
        bufGold[oIdx+1] = g;
        bufGold[oIdx+2] = b;
        bufGold[oIdx+3] = alpha;
      }

      // Version 3: Platinum White
      if (isAureliaLetter) {
        // Map smoothly to gleaming platinum white with bevel depth:
        // Shadow bevel: [195, 198, 205]
        // Face & Highlight: [255, 255, 255]
        const t = Math.max(0, Math.min(1, lum / 65));
        bufWhite[oIdx] = Math.round(200 * (1 - t) + 255 * t);
        bufWhite[oIdx+1] = Math.round(202 * (1 - t) + 255 * t);
        bufWhite[oIdx+2] = Math.round(210 * (1 - t) + 255 * t);
        bufWhite[oIdx+3] = alpha;
      } else if (isTaglineLetter) {
        bufWhite[oIdx] = 250;
        bufWhite[oIdx+1] = 250;
        bufWhite[oIdx+2] = 252;
        bufWhite[oIdx+3] = alpha;
      } else {
        bufWhite[oIdx] = r;
        bufWhite[oIdx+1] = g;
        bufWhite[oIdx+2] = b;
        bufWhite[oIdx+3] = alpha;
      }
    }
  }

  // Save all 3 versions to files
  await sharp(bufOrig, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile('c:/real estate/luxury-real-estate/public/test_v1_orig.png');

  await sharp(bufGold, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile('c:/real estate/luxury-real-estate/public/test_v2_gold.png');

  await sharp(bufWhite, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile('c:/real estate/luxury-real-estate/public/test_v3_white.png');

  console.log('Saved test_v1_orig.png, test_v2_gold.png, test_v3_white.png');

  // Also composite each onto intro-1.png to preview the exact intro visual!
  const bgMeta = await sharp('public/intro-1.png').metadata();
  const targetW = 1060;
  const targetH = Math.round(h * (targetW / w));
  const left = Math.round((bgMeta.width - targetW) / 2);
  const top = Math.round((bgMeta.height - targetH) / 2);

  for (const [name, file] of [
    ['v1_orig', 'public/test_v1_orig.png'],
    ['v2_gold', 'public/test_v2_gold.png'],
    ['v3_white', 'public/test_v3_white.png']
  ]) {
    const resized = await sharp(file).resize(targetW, targetH).toBuffer();
    await sharp('public/intro-1.png')
      .composite([{ input: resized, left, top }])
      .png()
      .toFile(`c:/real estate/luxury-real-estate/public/preview_${name}.png`);
  }
  console.log('Saved preview composites for all 3 versions!');
}

generateMasterLogos().catch(console.error);
