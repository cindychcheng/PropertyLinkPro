# ✅ Working Local Development Setup

## Start Local Server

```bash
npm run local
```

This starts the server on **http://localhost:3000**

## Test Your Setup

1. **Initialize test data:**
   ```bash
   curl "http://localhost:3000/api/init-db"
   ```

2. **Test birthday reminders:**
   ```bash
   curl "http://localhost:3000/api/reminders/birthdays"
   ```

3. **Test other endpoints:**
   ```bash
   curl "http://localhost:3000/api/properties"
   curl "http://localhost:3000/api/landlords"
   curl "http://localhost:3000/api/tenants"
   ```

## Development Workflow

1. **Start server:** `npm run local`
2. **Make changes** to `simple-dev.js`
3. **Stop server:** `Ctrl+C`
4. **Restart:** `npm run local`
5. **Test changes:** Use curl commands above

## Debug Birthday Reminders

The server includes extensive debugging for birthday reminders. After running `/api/init-db`, check the console output when you call `/api/reminders/birthdays` - you'll see:

- Current date and month
- All landlord owners and tenants being checked
- Birthday month comparisons
- Which records are added to results

## Key Features

✅ **Fast startup** - No build step needed
✅ **Simple in-memory storage** - No database required  
✅ **Extensive logging** - See exactly what's happening
✅ **Birthday debugging** - Full visibility into the filtering logic
✅ **All endpoints working** - Properties, landlords, tenants, reminders

## Common Issues

- **Port conflict:** If port 3000 is in use, the server won't start
- **Server not responding:** Make sure you see "Server running on..." message
- **Empty responses:** Run `/api/init-db` first to create test data

## Next Steps

Now you can:
1. Debug the birthday reminders issue locally
2. Make changes and test them instantly
3. See detailed logs of what's happening
4. Fix any issues without waiting for Railway deployments!