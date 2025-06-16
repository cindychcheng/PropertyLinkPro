# Authentication Setup Guide

## Current Status
✅ Database schema created with authentication tables
✅ Replit OAuth environment variables configured
✅ Initial system admin user created

## Getting Your Replit User ID

To become a super admin, you need your Replit user ID. Here's how to get it:

1. Sign in to your Replit account
2. Go to your profile or any of your repls
3. Your user ID will be in the URL or you can find it by:
   - Opening browser developer tools (F12)
   - Going to the Console tab
   - Running: `fetch('/api/login').then(r => console.log('Check Network tab for redirect URL'))`
   - Look for your user ID in the network request

## Adding Yourself as Super Admin

Once you have your Replit user ID, run this SQL command to make yourself a super admin:

```sql
INSERT INTO users (id, role, status, created_by) 
VALUES ('YOUR_REPLIT_USER_ID', 'super_admin', 'active', 'system')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';
```

Replace 'YOUR_REPLIT_USER_ID' with your actual Replit user ID.

## Testing Authentication

1. Navigate to the application
2. You should see the landing page with "Sign In to Continue" button
3. Click the button to authenticate with Replit
4. After successful authentication, you'll be redirected to the dashboard
5. The sidebar will show your profile and "Super Admin" role
6. You'll have access to the "User Management" section

## Adding Other Users

Once you're signed in as a super admin:

1. Go to "User Management" in the sidebar
2. Click "Add User"
3. Enter the new user's Replit user ID
4. Select their role (Read Only, Standard, Admin, or Super Admin)
5. Save the user

## Troubleshooting

- If authentication fails, check that REPLIT_DOMAINS environment variable matches your repl domain
- If you can't access user management, verify your role is set to 'super_admin' in the database
- Session issues can be resolved by clearing cookies and signing in again