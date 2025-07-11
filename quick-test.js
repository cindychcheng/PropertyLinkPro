// Quick test to debug the issue
import express from 'express';
const app = express();

console.log('Starting express server...');

app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.json({ message: 'Server is working!' });
});

const PORT = 3000;
console.log(`About to listen on port ${PORT}...`);

app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting server:', err);
  } else {
    console.log(`Server successfully started on port ${PORT}`);
    console.log(`Test with: curl http://localhost:${PORT}/`);
  }
});