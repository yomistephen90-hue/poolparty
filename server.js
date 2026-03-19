const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  // Default to index.html
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end(`404 — File not found: ${req.url}`);
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });

  console.log(`${new Date().toLocaleTimeString()} → ${req.url}`);
});

server.listen(PORT, () => {
  console.log('\n🏎️  PumpTrack dev server running!\n');
  console.log(`   http://localhost:${PORT}/          ← Landing page`);
  console.log(`   http://localhost:${PORT}/game.html  ← Live game`);
  console.log(`   http://localhost:${PORT}/simulate.html ← Practice mode`);
  console.log('\n   Press Ctrl+C to stop\n');
});
