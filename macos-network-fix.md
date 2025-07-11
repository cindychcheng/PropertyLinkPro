# 🍎 macOS Network Troubleshooting for Local Development

## Quick Checks

### 1. Check macOS Firewall Settings
```bash
# Check if firewall is enabled
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If firewall is on, temporarily disable it for testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Test your server, then re-enable if needed
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

### 2. Check for VPN or Network Extensions
- Look in System Preferences > Network for any VPN connections
- Check if you have any network security software running
- Try disconnecting VPN temporarily

### 3. Check DNS/Hosts File
```bash
# Check if localhost is properly configured
cat /etc/hosts | grep localhost

# Should show something like:
# 127.0.0.1	localhost
```

### 4. Test with Different Network Interface
```bash
# Get your network interfaces
ifconfig | grep inet

# Try binding to specific interface
# In your server, try: app.listen(PORT, '0.0.0.0', ...)
```

## Immediate Solutions

### Option A: Use Different Development Approach
Since the logic testing works perfectly:
```bash
# Test your changes instantly
node test-api.js

# Then push to Railway for full testing
git add -A && git commit -m "test" && git push origin main
```

### Option B: Try Browser-based Testing
1. Open Safari/Chrome
2. Go to: `http://localhost:3001/`
3. If browser shows different error than curl, that's a clue

### Option C: Try Different Ports
The port test showed these work: 3001, 8000, 8080, 9000, 3333

## Common macOS Issues

1. **Little Snitch** or similar network monitoring tools
2. **Corporate VPN** blocking localhost
3. **macOS Big Sur/Monterey** network stack changes
4. **Xcode** Command Line Tools network restrictions

## Quick Test Script
```bash
# Run this to test basic connectivity
node -e "
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Test works!');
});
server.listen(3002, '127.0.0.1', () => {
  console.log('Test server on 3002');
  const req = http.request('http://127.0.0.1:3002/', (res) => {
    console.log('SUCCESS: Got response');
    server.close();
  });
  req.on('error', (err) => {
    console.log('FAILED:', err.message);
    server.close();
  });
  req.end();
});
"
```

Would you like to try any of these approaches?