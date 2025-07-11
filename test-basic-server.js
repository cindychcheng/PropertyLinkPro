// Most basic possible HTTP server
import { createServer } from 'http';

console.log('Starting basic HTTP server...');

const server = createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Basic server working!',
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  }));
});

const PORT = 8888;

server.listen(PORT, () => {
  console.log(`Basic server listening on port ${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/`);
  
  // Self test
  import('http').then(http => {
    const req = http.default.request(`http://localhost:${PORT}/test`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Self-test result: ${data}`);
      });
    });
    req.on('error', err => console.log(`Self-test error: ${err.message}`));
    req.end();
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});