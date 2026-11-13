import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.js':   'text/javascript; charset=UTF-8',
  '.css':  'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.xml':  'application/xml; charset=UTF-8',
  '.txt':  'text/plain; charset=UTF-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
  '.mp4':  'video/mp4',
};

// File types that benefit from compression
const compressible = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg']);

// Cache-control by extension
function getCacheControl(ext) {
  if (ext === '.html' || ext === '.css' || ext === '.js') {
    return 'no-cache, no-store, must-revalidate, max-age=0';
  }
  if (['.jpg','.jpeg','.png','.webp','.avif','.svg','.ico','.woff2','.woff','.ttf','.mp4'].includes(ext)) {
    return 'public, max-age=31536000, immutable'; // 1 year for static media
  }
  if (ext === '.xml' || ext === '.txt') {
    return 'public, max-age=3600';
  }
  return 'no-cache';
}

// Strictly allow-listed public routes & file patterns
function isPubliclyAccessible(relPath) {
  // Normalize path separators to forward slashes for matching
  const p = relPath.replace(/\\/g, '/');

  // Exact public root files
  if (p === 'index.html' || p === 'style.css' || p === 'script.js' || p === 'favicon.svg' || p === 'robots.txt' || p === 'sitemap.xml') {
    return true;
  }

  // Allowed public engine scripts in assets/js/
  if (p.startsWith('assets/js/') && p.endsWith('.min.js')) {
    return true;
  }

  // Allowed logo/brand images in assets/images/
  if (p.startsWith('assets/images/')) {
    const ext = path.extname(p).toLowerCase();
    if (['.webp', '.avif', '.png', '.svg'].includes(ext)) {
      return true;
    }
  }

  // Allowed image assets in root
  const ext = path.extname(p).toLowerCase();
  if (['.webp', '.avif', '.png', '.jpg', '.jpeg', '.svg', '.ico'].includes(ext)) {
    // Disallow backup/test image patterns
    if (!p.includes('.orig') && !p.includes('-before') && !p.includes('.bak')) {
      return true;
    }
  }

  // Everything else (server.js, package.json, dotfiles, src/, configs, test scripts) is blocked
  return false;
}

const server = http.createServer((req, res) => {
  // Only allow GET and HEAD methods
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain', 'Allow': 'GET, HEAD' });
    res.end('405 Method Not Allowed');
    return;
  }

  // 1. Path sanitization & Traversal Defense
  let rawUrl = req.url.split('?')[0];
  let reqPath;
  try {
    reqPath = decodeURIComponent(rawUrl);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request: Malformed URI');
    return;
  }

  // Block null bytes
  if (reqPath.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  // Strip leading slash
  let cleanRel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');

  // Resolve absolute path and verify boundary
  const resolvedPath = path.resolve(__dirname, cleanRel);
  const relFromRoot = path.relative(__dirname, resolvedPath);

  // Boundary check: must be strictly inside __dirname
  if (relFromRoot.startsWith('..') || path.isAbsolute(relFromRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  // Allowlist verification: block any sensitive files, dotfiles, or internal source code
  if (!isPubliclyAccessible(relFromRoot)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  let ext = path.extname(resolvedPath).toLowerCase();
  let contentType = mimeTypes[ext] || 'application/octet-stream';
  let cacheControl = getCacheControl(ext);

  // Comprehensive Enterprise Defensive Security Headers
  const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.google.com https://*.googleapis.com https://*.gstatic.com; frame-src 'self' https://www.google.com https://maps.google.com; connect-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  fs.readFile(resolvedPath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
      return;
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldCompress = compressible.has(ext) && content.length > 1024;

    const baseHeaders = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding',
      ...securityHeaders,
    };

    if (req.method === 'HEAD') {
      res.writeHead(200, { ...baseHeaders, 'Content-Length': content.length });
      res.end();
      return;
    }

    if (shouldCompress && acceptEncoding.includes('br')) {
      zlib.brotliCompress(content, (err2, compressed) => {
        if (err2) {
          res.writeHead(200, baseHeaders);
          res.end(content);
        } else {
          res.writeHead(200, { ...baseHeaders, 'Content-Encoding': 'br', 'Content-Length': compressed.length });
          res.end(compressed);
        }
      });
    } else if (shouldCompress && acceptEncoding.includes('gzip')) {
      zlib.gzip(content, (err2, compressed) => {
        if (err2) {
          res.writeHead(200, baseHeaders);
          res.end(content);
        } else {
          res.writeHead(200, { ...baseHeaders, 'Content-Encoding': 'gzip', 'Content-Length': compressed.length });
          res.end(compressed);
        }
      });
    } else {
      res.writeHead(200, { ...baseHeaders, 'Content-Length': content.length });
      res.end(content);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Iron Pulse server running at http://localhost:${PORT}/`);
  console.log(`  ✓ Brotli + Gzip compression enabled`);
  console.log(`  ✓ Strict Route Whitelist active (Dotfiles, sources & configs blocked)`);
  console.log(`  ✓ Path Traversal defense active`);
  console.log(`  ✓ Content-Security-Policy & HSTS headers active`);
});
