// Simple local server for testing
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables for local development
process.env.USE_MEMORY_STORAGE = 'true';
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';

console.log('🚀 Starting local PropertyLinkPro server...');
console.log('📡 Using in-memory storage');
console.log('🌐 Server will be available at: http://localhost:3000');

// Start the simple production server
const server = spawn('node', ['dist/simple-server.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill();
  process.exit(0);
});