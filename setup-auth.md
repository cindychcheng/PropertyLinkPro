# Authentication Setup Guide

## Current Status
✅ Database schema created with authentication tables
✅ Replit OAuth environment variables configured  
✅ Authentication system working properly
✅ Session storage configured with PostgreSQL

## Quick Setup (3 Steps)

### Step 1: Get Your Replit User ID
1. Click the "Sign In to Continue" button on the landing page
2. Complete the Replit OAuth login process
3. Check the server logs in the console - your user ID will appear
4. Copy the user ID (it's a long string of numbers)

### Step 2: Make Yourself Super Admin
Run this command in the Shell tab, replacing `YOUR_USER_ID` with the ID from step 1:

```bash
node add-admin.js YOUR_USER_ID
```

### Step 3: Sign In Again
1. Go back to the application
2. Click "Sign In to Continue"
3. You'll now have super admin access with the "User Management" section visible

## Testing Authentication

1. Navigate to the application
2. You should see the landing page with "Sign In to Continue" button
3. Click the button to authenticate with Replit
4. After successful authentication, you'll be redirected to the dashboard
5. The sidebar will show your profile and role
6. As a super admin, you'll have access to the "User Management" section

## Adding Other Users

Once you're signed in as a super admin:

1. Go to "User Management" in the sidebar
2. Click "Add User"
3. Enter the new user's Replit user ID
4. Select their role (Read Only, Standard, Admin, or Super Admin)
5. Save the user

## Role Permissions

- **Read Only**: View all data, cannot make changes
- **Standard**: Read access plus ability to edit properties, tenants, and landlords
- **Admin**: Standard permissions plus advanced features (audit logs, system settings)
- **Super Admin**: Complete access including user management and system administration

## Troubleshooting

- If authentication fails, verify the Replit OAuth environment variables are set correctly
- If you can't access user management, confirm your role is set to 'super_admin' in the database
- Session issues can be resolved by clearing cookies and signing in again
- Check server logs for authentication errors and user IDs during the login process
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