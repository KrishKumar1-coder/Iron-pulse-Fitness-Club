const sharp = require('sharp');
const fs = require('fs');

async function buildFinalPerfectLogo() {
  const { data, info } = await sharp('c:/real estate/logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  const bgMask = new Uint8Array(w * h);

  // SECTION 1: HEADER (y < 330)
  for (let y = 0; y < 330; y++) {
    for (let x = 0; x < w; x++) {
      const pIdx = y * w + x;
      const sIdx = pIdx * 3;
      const r = data[sIdx], g = data[sIdx+1], b = data[sIdx+2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const warm = r - b;

      // 1. Outside horizontal bounds of the logo header
      if (x < 390 || x > 1365) {
        bgMask[pIdx] = 1;
        continue;
      }

      // 2. Gold elements: Roof beams, chimney, horizontal divider, ESTATES, accent bars
      const isGold = (sat >= 16 && warm >= 14 && r >= 105);
      if (isGold) {
        bgMask[pIdx] = 0;
        continue;
      }

      // 3. Chimney structure
      const isChimney = (x >= 940 && x <= 975 && y >= 60 && y <= 140 && (sat > 12 || lum < 110));
      if (isChimney) {
        bgMask[pIdx] = 0;
        continue;
      }

      // 4. 4 Windows inside roof gable
      const isWindow = (x >= 850 && x <= 906 && y >= 110 && y <= 155 && (b >= r + 2 || lum < 85));
      if (isWindow) {
        bgMask[pIdx] = 0;
        continue;
      }

      // 5. AURELIA letters (x in [392..848], y in [168..268])
      const isAurelia = (x >= 392 && x <= 848 && y >= 168 && y <= 268 && (lum < 98 || (sat > 10 && b > r)));
      if (isAurelia) {
        bgMask[pIdx] = 0;
        continue;
      }

      // 6. Tagline "YOUR DREAM. OUR COMMITMENT." (x in [384..1348], y in [275..318])
      const isTagline = (x >= 384 && x <= 1348 && y >= 275 && y <= 318 && (lum < 105 || (sat > 10 && b > r)));
      if (isTagline) {
        bgMask[pIdx] = 0;
        continue;
      }

      // Everything else in y < 330 is background (outside, inside gable, letter loops, between letters)
      bgMask[pIdx] = 1;
    }
  }

  // SECTION 2: LOWER REGION (y >= 330: House & Hands)
  // Flood fill from all outer borders
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

    // Checkerboard detection in lower area (neutral grey/white)
    const isCb = (sat <= 14 && lum >= 105 && warm <= 14) || (sat <= 9 && lum >= 88 && warm <= 9);

    if (isCb) {
      bgMask[pIdx] = 1;
      queue[qTail++] = x;
      queue[qTail++] = y;
    }
  }

  // Seed borders
  for (let y = 330; y < h; y++) {
    pushQueue(0, y);
    pushQueue(1, y);
    pushQueue(w - 2, y);
    pushQueue(w - 1, y);
  }
  for (let x = 0; x < w; x++) {
    pushQueue(x, h - 1);
    pushQueue(x, h - 2);
  }
  for (let x = 0; x < w; x++) {
    if (bgMask[329 * w + x] === 1) {
      pushQueue(x, 330);
      pushQueue(x, 331);
    }
  }

  while (qHead < qTail) {
    const cx = queue[qHead++];
    const cy = queue[qHead++];
    pushQueue(cx + 1, cy);
    pushQueue(cx - 1, cy);
    pushQueue(cx, cy + 1);
    pushQueue(cx, cy - 1);
  }

  // SECTION 3: Subpixel Alpha & Edge Smoothing
  const alphaMap = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pIdx = y * w + x;
      if (bgMask[pIdx] === 1) {
        alphaMap[pIdx] = 0;
        continue;
      }

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
        const sIdx = pIdx * 3;
        const r = data[sIdx], g = data[sIdx+1], b = data[sIdx+2];
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        let aFactor = 1.0 - (bgCount / 12);
        if (sat < 15 && lum > 140) {
          const bgProportion = Math.min(1, Math.max(0, (lum - 100) / 120));
          aFactor *= (1.0 - bgProportion * 0.7);
        }
        alphaMap[pIdx] = Math.max(35, Math.min(255, Math.round(aFactor * 255)));
      }
    }
  }

  // SECTION 4: Master Composite Buffer
  const out = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pIdx = y * w + x;
      const sIdx = pIdx * 3;
      const oIdx = pIdx * 4;
      const alpha = alphaMap[pIdx];

      if (alpha === 0) continue;

      const r = data[sIdx], g = data[sIdx+1], b = data[sIdx+2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      const isAureliaLetter = (x >= 392 && x <= 848 && y >= 168 && y <= 268 && bgMask[pIdx] === 0);
      const isTaglineLetter = (x >= 384 && x <= 1348 && y >= 275 && y <= 318 && bgMask[pIdx] === 0 && lum < 105);

      if (isAureliaLetter) {
        // Map 3D bevel of original navy letters to rich 3D gold matching ESTATES
        const t = Math.max(0, Math.min(1, lum / 65));
        out[oIdx] = Math.round(160 * (1 - t) + 255 * t);
        out[oIdx+1] = Math.round(110 * (1 - t) + 230 * t);
        out[oIdx+2] = Math.round(48 * (1 - t) + 165 * t);
        out[oIdx+3] = alpha;
      } else if (isTaglineLetter) {
        // Crisp, clear luxury gold tagline
        const t = Math.max(0, Math.min(1, lum / 60));
        out[oIdx] = Math.round(232 + 23 * t);
        out[oIdx+1] = Math.round(192 + 35 * t);
        out[oIdx+2] = Math.round(128 + 35 * t);
        out[oIdx+3] = alpha;
      } else {
        out[oIdx] = r;
        out[oIdx+1] = g;
        out[oIdx+2] = b;
        out[oIdx+3] = alpha;
      }
    }
  }

  // Save to public/logo-clean.png and public/logo-transparent.png
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile('c:/real estate/luxury-real-estate/public/logo-clean.png');

  fs.copyFileSync(
    'c:/real estate/luxury-real-estate/public/logo-clean.png',
    'c:/real estate/luxury-real-estate/public/logo-transparent.png'
  );

  console.log('Successfully written master logo-clean.png and logo-transparent.png');

  // Generate preview composite on intro-1.png
  const bgMeta = await sharp('public/intro-1.png').metadata();
  const targetW = 1060;
  const targetH = Math.round(h * (targetW / w));
  const left = Math.round((bgMeta.width - targetW) / 2);
  const top = Math.round((bgMeta.height - targetH) / 2);

  const resized = await sharp('public/logo-clean.png').resize(targetW, targetH).toBuffer();
  await sharp('public/intro-1.png')
    .composite([{ input: resized, left, top }])
    .png()
    .toFile('c:/real estate/luxury-real-estate/public/preview_final_perfect.png');

  console.log('Saved preview_final_perfect.png');
}

buildFinalPerfectLogo().catch(console.error);
