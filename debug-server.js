// Debug server to understand the issue
import express from 'express';
import http from 'http';

console.log('🔍 Starting debug server...');

const app = express();

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  console.log('Root endpoint hit!');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

app.get('/test', (req, res) => {
  res.json({ test: 'success' });
});

const PORT = 3002;
console.log(`Attempting to start server on port ${PORT}...`);

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Server started successfully on port ${PORT}`);
  console.log(`✅ Server address:`, server.address());
  
  // Test the server immediately after it starts
  console.log('🧪 Testing server connectivity...');
  
  setTimeout(() => {
    const testReq = http.request('http://127.0.0.1:3002/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Self-test SUCCESS:', data);
      });
    });
    
    testReq.on('error', (err) => {
      console.log('❌ Self-test FAILED:', err.message);
    });
    
    testReq.end();
  }, 100); // Wait 100ms then test
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.on('listening', () => {
  console.log('📡 Server listening event fired');
});

console.log('🔄 Server setup code executed, waiting for server to start...');