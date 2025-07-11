// Ultra-simple test server
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);
});