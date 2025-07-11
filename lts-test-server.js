// Simple test with LTS Node.js
import express from 'express';

console.log(`🚀 Testing Express with Node.js ${process.version} (LTS)`);

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: "Working with LTS Node.js!",
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', nodeVersion: process.version });
});

const PORT = 8888; // Use the port that worked before
const server = app.listen(PORT, (err) => {
  if (err) {
    console.error('Server error:', err);
    return;
  }
  
  console.log(`
✅ Server running on http://localhost:${PORT}
🧪 Node.js version: ${process.version}
📡 Testing with curl...
  `);
  
  // Self-test
  import('http').then(http => {
    const req = http.default.request(`http://localhost:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Internal test SUCCESS:', JSON.parse(data).status);
        console.log('🧪 Now try: curl "http://localhost:8888/health"');
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Internal test FAILED:', err.message);
    });
    
    req.end();
  });
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});