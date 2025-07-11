// Test different ports to find one that works
import express from 'express';

const testPorts = [3001, 8000, 8080, 9000, 3333];

function testPort(port) {
  return new Promise((resolve) => {
    const app = express();
    
    app.get('/', (req, res) => {
      res.json({ message: `Working on port ${port}!` });
    });
    
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`✅ Port ${port}: SUCCESS - Server listening`);
      
      // Test if we can actually connect
      import('http').then(http => {
        const req = http.default.request(`http://127.0.0.1:${port}/`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`✅ Port ${port}: HTTP test SUCCESS - ${data}`);
            server.close();
            resolve({ port, success: true });
          });
        });
        
        req.on('error', (err) => {
          console.log(`❌ Port ${port}: HTTP test FAILED - ${err.message}`);
          server.close();
          resolve({ port, success: false, error: err.message });
        });
        
        req.end();
      });
      
    }).on('error', (err) => {
      console.log(`❌ Port ${port}: FAILED to start - ${err.message}`);
      resolve({ port, success: false, error: err.message });
    });
  });
}

async function findWorkingPort() {
  console.log('🔍 Testing different ports...\n');
  
  for (const port of testPorts) {
    await testPort(port);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n✨ Port testing complete!');
}

findWorkingPort();