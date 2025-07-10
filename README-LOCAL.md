# Local Development Setup

## Quick Local Testing

Here's the fastest way to test your changes locally:

### Method 1: Use Railway for quick testing
```bash
# Make your changes
git add -A
git commit -m "your changes"
git push origin main

# Test at: https://propertylinkpro-production.up.railway.app
```

### Method 2: Local server (if you want to debug)
```bash
# 1. Build the project
npm run build

# 2. Start local server with memory storage
USE_MEMORY_STORAGE=true PORT=3000 npm start

# 3. Test in browser or curl
open http://localhost:3000
curl "http://localhost:3000/api/init-db"
curl "http://localhost:3000/api/reminders/birthdays"
```

## Development Workflow

1. **Make changes** to files in `server/` directory
2. **Test quickly** by pushing to Railway (15-30 seconds)
3. **For deeper debugging**, use local server

## Common Testing Commands

```bash
# Initialize test data
curl "http://localhost:3000/api/init-db"

# Test birthday reminders
curl "http://localhost:3000/api/reminders/birthdays"

# Test all endpoints
curl "http://localhost:3000/api/properties"
curl "http://localhost:3000/api/landlords"
curl "http://localhost:3000/api/tenants"
curl "http://localhost:3000/api/reminders/rental-increases"
```

## Current Status

✅ Birthday reminders - Working on Railway
✅ Properties endpoint - Working  
✅ Landlords endpoint - Working
✅ Tenants endpoint - Working
✅ Rental increase reminders - Working

## Next Steps

Since Railway deployment is working well and is fast (15-30 seconds), I recommend:

1. Continue using Railway for testing
2. Make small commits with clear messages
3. Test each change individually
4. Use local server only when you need to debug deeply

The Railway approach is actually faster than local development setup for this project!