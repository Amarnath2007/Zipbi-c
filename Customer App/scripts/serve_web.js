const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.resolve(__dirname, '../build/web');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // Normalize URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Redirect /admin to the backend admin dashboard
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    res.writeHead(302, { Location: `http://localhost:5000${pathname}` });
    res.end();
    return;
  }

  // Serve uploaded cafe photographs directly from backend/uploads
  if (pathname.startsWith('/uploads/')) {
    const uploadFilePath = path.join(path.resolve(__dirname, '../backend/uploads'), pathname.replace(/^\/uploads\//, ''));
    if (fs.existsSync(uploadFilePath) && fs.statSync(uploadFilePath).isFile()) {
      const ext = path.extname(uploadFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(uploadFilePath).pipe(res);
      return;
    }
  }

  if (pathname === '/') pathname = '/index.html';

  let filePath = path.join(PUBLIC_DIR, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if file exists, else fallback to index.html for SPA routing
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath) && !pathname.startsWith('/assets/')) {
      filePath = indexPath;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  res.writeHead(200, { 'Content-Type': contentType });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[StaticServer] ZipBi Customer Web app running at http://localhost:${PORT}`);
  console.log(`[StaticServer] Serving directory: ${PUBLIC_DIR}`);
});

