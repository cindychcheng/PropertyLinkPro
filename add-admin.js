// Simple script to add yourself as a super admin
// Run this with: node add-admin.js YOUR_REPLIT_USER_ID

const { Pool } = require('pg');

async function addAdmin(userId) {
  if (!userId) {
    console.log('Usage: node add-admin.js YOUR_REPLIT_USER_ID');
    console.log('To get your Replit user ID:');
    console.log('1. Sign in to the app (click "Sign In to Continue")');
    console.log('2. Check the server logs for your user ID');
    console.log('3. Or check the URL after OAuth redirect');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query(
      `INSERT INTO users (id, role, status, created_by) 
       VALUES ($1, 'super_admin', 'active', 'system')
       ON CONFLICT (id) DO UPDATE SET 
       role = 'super_admin', 
       status = 'active',
       updated_at = NOW()
       RETURNING *`,
      [userId]
    );

    console.log('✅ Successfully added/updated super admin:', result.rows[0]);
    console.log('🎉 You can now sign in and access the User Management section');
  } catch (error) {
    console.error('❌ Error adding admin:', error.message);
  } finally {
    await pool.end();
  }
}

const userId = process.argv[2];
addAdmin(userId);