import https from 'https';

// Test the Azure callback route
const testUrl = 'https://b0875a67-4e52-4dc8-aabc-7dcf8e68095a-00-1ixt1u13xisls.picard.replit.dev/api/auth/azure/test';

console.log('Testing Azure callback route accessibility...');
console.log('URL:', testUrl);

https.get(testUrl, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});