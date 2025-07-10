# Local Development Workflow

## Quick Setup

1. **Start local server:**
   ```bash
   npm run local
   ```
   This will:
   - Build the project
   - Start server on http://localhost:3000
   - Use in-memory storage (no database needed)

2. **Test endpoints:**
   ```bash
   node test-endpoints.js
   ```

## Manual Testing

Once server is running, you can test individual endpoints:

```bash
# Initialize test data
curl "http://localhost:3000/api/init-db"

# Test birthday reminders
curl "http://localhost:3000/api/reminders/birthdays"

# Test properties
curl "http://localhost:3000/api/properties"

# Test landlords
curl "http://localhost:3000/api/landlords"

# Test tenants
curl "http://localhost:3000/api/tenants"
```

## Development Loop

1. Make changes to code
2. Stop server (Ctrl+C)
3. Run `npm run local` to rebuild and restart
4. Test your changes with curl or test script

## Browser Testing

Visit http://localhost:3000 to see the API interface in your browser.

## Tips

- Server runs on port 3000 locally (different from Railway port 8080)
- All data is in-memory, resets when server restarts
- Run `/api/init-db` first to create test data
- Check console logs for debugging information