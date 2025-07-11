// Debug Node.js and Express installation
console.log('=== Node.js & Express Installation Debug ===');

// Check Node.js
console.log('Node.js version:', process.version);
console.log('Node.js executable:', process.execPath);
console.log('Current working directory:', process.cwd());
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

// Check Express
try {
  const express = await import('express');
  console.log('✅ Express import: SUCCESS');
  
  const app = express.default();
  console.log('✅ Express app creation: SUCCESS');
  
  // Test basic middleware
  app.use((req, res, next) => {
    console.log('Middleware test');
    next();
  });
  console.log('✅ Middleware setup: SUCCESS');
  
  // Test route creation
  app.get('/test', (req, res) => {
    res.json({ test: 'works' });
  });
  console.log('✅ Route creation: SUCCESS');
  
  // Test server creation (but don't start it)
  const server = app.listen(0, () => {  // Port 0 = auto-assign
    const address = server.address();
    console.log(`✅ Server creation: SUCCESS on port ${address.port}`);
    
    // Test internal request
    import('http').then(http => {
      const req = http.default.request(`http://localhost:${address.port}/test`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ Internal request: SUCCESS -', data);
          server.close();
          console.log('✅ Server cleanup: SUCCESS');
        });
      });
      
      req.on('error', (err) => {
        console.log('❌ Internal request: FAILED -', err.message);
        server.close();
      });
      
      req.end();
    });
  });
  
  server.on('error', (err) => {
    console.log('❌ Server error:', err.message);
  });
  
} catch (error) {
  console.log('❌ Express error:', error.message);
}

// Check environment
console.log('\n=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PATH contains node:', process.env.PATH.includes('node'));
console.log('User ID:', process.getuid());
console.log('Group ID:', process.getgid());

// Check permissions
import { access, constants } from 'fs';
const checkPath = process.cwd();
access(checkPath, constants.R_OK | constants.W_OK, (err) => {
  if (err) {
    console.log('❌ Directory permissions: FAILED -', err.message);
  } else {
    console.log('✅ Directory permissions: SUCCESS');
  }
});