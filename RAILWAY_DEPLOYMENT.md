# Railway Deployment Guide

## Quick Deploy Steps

### 1. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub (recommended)

### 2. Deploy PropertyLinkPro
- Click "Deploy from GitHub repo"
- Select your PropertyLinkPro repository
- Railway will automatically detect it's a Node.js app

### 3. Add Database
- In Railway dashboard, click "Add Plugin"
- Select "PostgreSQL"
- Railway will create a free PostgreSQL database

### 4. Configure Environment Variables
In Railway project settings → Variables, add:

```
NODE_ENV=production
USE_MEMORY_STORAGE=false
```

The DATABASE_URL will be automatically provided by Railway's PostgreSQL plugin.

### 5. Deploy
- Railway will automatically build and deploy
- You'll get a public URL like: `https://your-app-name.railway.app`

## Alternative: Demo Mode (No Database)

If you want to deploy without setting up a database:

Set environment variable:
```
USE_MEMORY_STORAGE=true
```

This will run the app with in-memory storage (data won't persist between deployments).

## Features Available After Deployment

✅ Property management dashboard
✅ Landlord and tenant tracking  
✅ Rental rate increase reminders
✅ Birthday reminders
✅ Search functionality
✅ Multiple authentication options

## Troubleshooting

If deployment fails:
1. Check build logs in Railway dashboard
2. Ensure all environment variables are set
3. Verify PostgreSQL plugin is connected
4. Check that NODE_ENV is set to "production"