// PropertyLinkPro Server with Rental Increase Processing
import express from 'express';
import session from 'express-session';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const app = express();
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
const publicPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(publicPath));

// Admin user
const adminUser = {
  id: 'admin',
  email: 'admin@instarealty.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin',
  status: 'active'
};

// In-memory storage
const rentalRateIncreases = new Map();

// User roles and permissions
const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  STAFF: 'staff',
  READ_ONLY: 'read_only'
};

const PERMISSIONS = {
  // Property management
  VIEW_PROPERTIES: 'view_properties',
  EDIT_PROPERTIES: 'edit_properties',
  ADD_PROPERTIES: 'add_properties',
  DELETE_PROPERTIES: 'delete_properties',
  
  // Tenant management
  VIEW_TENANTS: 'view_tenants',
  EDIT_TENANTS: 'edit_tenants',
  ADD_TENANTS: 'add_tenants',
  
  // Financial operations
  PROCESS_RATE_INCREASES: 'process_rate_increases',
  VIEW_FINANCIAL_DATA: 'view_financial_data',
  
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // System administration
  ADMIN_ACCESS: 'admin_access'
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.VIEW_PROPERTIES, PERMISSIONS.EDIT_PROPERTIES, PERMISSIONS.ADD_PROPERTIES,
    PERMISSIONS.VIEW_TENANTS, PERMISSIONS.EDIT_TENANTS, PERMISSIONS.ADD_TENANTS,
    PERMISSIONS.PROCESS_RATE_INCREASES, PERMISSIONS.VIEW_FINANCIAL_DATA,
    PERMISSIONS.VIEW_USERS
  ],
  [USER_ROLES.STAFF]: [
    PERMISSIONS.VIEW_PROPERTIES, PERMISSIONS.EDIT_PROPERTIES,
    PERMISSIONS.VIEW_TENANTS, PERMISSIONS.EDIT_TENANTS,
    PERMISSIONS.VIEW_FINANCIAL_DATA
  ],
  [USER_ROLES.READ_ONLY]: [
    PERMISSIONS.VIEW_PROPERTIES, PERMISSIONS.VIEW_TENANTS, PERMISSIONS.VIEW_FINANCIAL_DATA
  ]
};

// Database functionality (conditionally imported)
let db = null;
let usersTable = null;
let eq = null;

// Simple PostgreSQL connection without Drizzle for Railway compatibility
async function initializeDatabase() {
  if (process.env.USE_MEMORY_STORAGE !== 'true' && process.env.DATABASE_URL) {
    try {
      // Try to use a simple PostgreSQL connection
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      // Test connection
      await pool.query('SELECT 1');
      
      // Store pool for manual queries
      global.dbPool = pool;
      
      console.log('🗄️ PostgreSQL connected successfully');
      
      // Create users table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY,
          email VARCHAR UNIQUE,
          first_name VARCHAR,
          last_name VARCHAR,
          role VARCHAR DEFAULT 'staff',
          status VARCHAR DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW(),
          last_login_at TIMESTAMP
        )
      `);
      
      console.log('📋 Users table ready');
      
    } catch (error) {
      console.log('⚠️ Database connection failed, using memory storage:', error.message);
      process.env.USE_MEMORY_STORAGE = 'true'; // Fallback to memory
    }
  }
}

// In-memory storage for magic tokens and fallback if database fails
const magicTokens = new Map(); // For magic link authentication
let users = new Map(); // Fallback for memory storage

// Helper functions for user management
async function createUser(userData) {
  const user = {
    id: userData.id || `user_${Date.now()}`,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role || USER_ROLES.STAFF,
    status: userData.status || 'active',
    createdAt: new Date(),
    lastLoginAt: null
  };

  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    users.set(user.id, user);
    return user;
  } else {
    try {
      await global.dbPool.query(
        'INSERT INTO users (id, email, first_name, last_name, role, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [user.id, user.email, user.firstName, user.lastName, user.role, user.status, user.createdAt]
      );
      return user;
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      users.set(user.id, user);
      return user;
    }
  }
}

async function getUserByEmail(email) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    for (const user of users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  } else {
    try {
      const result = await global.dbPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          role: row.role,
          status: row.status,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at
        };
      }
      return null;
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      for (const user of users.values()) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return user;
        }
      }
      return null;
    }
  }
}

async function getUserById(id) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    return users.get(id) || null;
  } else {
    try {
      const result = await global.dbPool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          role: row.role,
          status: row.status,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at
        };
      }
      return null;
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return users.get(id) || null;
    }
  }
}

async function getAllUsers() {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    return Array.from(users.values());
  } else {
    try {
      const result = await global.dbPool.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows.map(row => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at
      }));
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return Array.from(users.values());
    }
  }
}

async function updateUser(id, updates) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    const user = users.get(id);
    if (user) {
      Object.assign(user, updates);
      return user;
    }
    return null;
  } else {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      if (updates.email) {
        fields.push(`email = $${paramIndex}`);
        values.push(updates.email);
        paramIndex++;
      }
      if (updates.firstName) {
        fields.push(`first_name = $${paramIndex}`);
        values.push(updates.firstName);
        paramIndex++;
      }
      if (updates.lastName) {
        fields.push(`last_name = $${paramIndex}`);
        values.push(updates.lastName);
        paramIndex++;
      }
      if (updates.role) {
        fields.push(`role = $${paramIndex}`);
        values.push(updates.role);
        paramIndex++;
      }
      if (updates.status) {
        fields.push(`status = $${paramIndex}`);
        values.push(updates.status);
        paramIndex++;
      }
      if (updates.lastLoginAt) {
        fields.push(`last_login_at = $${paramIndex}`);
        values.push(updates.lastLoginAt);
        paramIndex++;
      }
      
      values.push(id);
      
      await global.dbPool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
      
      return await getUserById(id);
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      const user = users.get(id);
      if (user) {
        Object.assign(user, updates);
        return user;
      }
      return null;
    }
  }
}

async function deleteUser(id) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    return users.delete(id);
  } else {
    try {
      await global.dbPool.query('DELETE FROM users WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return users.delete(id);
    }
  }
}

function hasPermission(user, permission) {
  if (!user || user.status !== 'active') return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

function generateMagicToken() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Email configuration (using ethereal for testing, replace with real SMTP in production)
let emailTransporter;
async function setupEmailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production SMTP configuration
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development mode - create test account
    const testAccount = await nodemailer.createTestAccount();
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Using Ethereal email for development');
    console.log('📧 Preview emails at: https://ethereal.email');
  }
}

async function sendMagicLink(email, token) {
  if (!emailTransporter) {
    console.error('❌ Email transporter not configured');
    return false;
  }

  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://web-production-2b556.up.railway.app' 
    : 'http://127.0.0.1:8080';
  const magicLink = `${baseUrl}/auth/magic?token=${token}`;
  
  try {
    const info = await emailTransporter.sendMail({
      from: '"PropertyLinkPro" <cindychcheng@gmail.com>',
      to: email,
      subject: 'Your PropertyLinkPro Login Link',
      html: `
        <h2>PropertyLinkPro Login</h2>
        <p>Click the link below to sign in to your PropertyLinkPro account:</p>
        <p><a href="${magicLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Sign In to PropertyLinkPro</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this login link, you can safely ignore this email.</p>
      `
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Magic link email sent:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send magic link email:', error);
    return false;
  }
}

// Initialize with sample users
async function initializeSampleUsers() {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    await createUser({
      id: 'admin',
      email: 'admin@instarealty.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: USER_ROLES.ADMIN,
      status: 'active'
    });

    await createUser({
      id: 'manager_1',
      email: 'sarah.manager@company.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: USER_ROLES.MANAGER,
      status: 'active'
    });

    await createUser({
      id: 'staff_1',
      email: 'john.staff@company.com',
      firstName: 'John',
      lastName: 'Smith',
      role: USER_ROLES.STAFF,
      status: 'active'
    });
  } else {
    // For database mode, only create admin if it doesn't exist
    const existingAdmin = await getUserByEmail('admin@instarealty.com');
    if (!existingAdmin) {
      await createUser({
        id: 'admin',
        email: 'admin@instarealty.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: USER_ROLES.ADMIN,
        status: 'active'
      });
    }
  }
}

// Initialize with sample data
rentalRateIncreases.set('456 Oak Street, Vancouver, BC', {
  propertyAddress: '456 Oak Street, Vancouver, BC',
  latestRentalRate: 2500,
  latestRateIncreaseDate: '2023-01-15',
  nextAllowableRentalIncreaseDate: '2024-01-15',
  nextAllowableRentalRate: 2575,
  reminderDate: '2023-09-15'
});

rentalRateIncreases.set('789 Pine Avenue, Vancouver, BC', {
  propertyAddress: '789 Pine Avenue, Vancouver, BC',
  latestRentalRate: 2200,
  latestRateIncreaseDate: '2023-03-01',
  nextAllowableRentalIncreaseDate: '2024-03-01',
  nextAllowableRentalRate: 2266,
  reminderDate: '2023-11-01'
});

// Properties data
const propertiesData = [
  {
    propertyAddress: '456 Oak Street, Vancouver, BC',
    keyNumber: 'OAK001',
    serviceType: 'Full-Service Management',
    landlordOwners: [{ name: 'John Doe', contactNumber: '604-555-0123' }],
    tenant: { id: 1, name: 'Jane Smith', email: 'jane@email.com', moveInDate: '2022-01-15' },
    activeTenants: [{ id: 1, name: 'Jane Smith' }],
    rentalInfo: {
      latestRentalRate: 2500,
      latestRateIncreaseDate: '2023-01-15',
      nextAllowableRentalIncreaseDate: '2024-01-15',
      nextAllowableRentalRate: 2575
    }
  },
  {
    propertyAddress: '789 Pine Avenue, Vancouver, BC',
    keyNumber: 'PINE002',
    serviceType: 'Tenant Placement Only',
    landlordOwners: [{ name: 'Sarah Wilson', contactNumber: '604-555-0456' }],
    tenant: { id: 2, name: 'Bob Wilson', email: 'bob@email.com', moveInDate: '2022-03-01' },
    activeTenants: [{ id: 2, name: 'Bob Wilson' }],
    rentalInfo: {
      latestRentalRate: 2200,
      latestRateIncreaseDate: '2023-03-01',
      nextAllowableRentalIncreaseDate: '2024-03-01',
      nextAllowableRentalRate: 2266
    }
  }
];

// Rental history data
const rentalHistoryData = {
  '456 Oak Street, Vancouver, BC': [
    {
      id: 1,
      propertyAddress: '456 Oak Street, Vancouver, BC',
      increaseDate: '2022-01-15',
      previousRate: 0,
      newRate: 2300,
      notes: 'Initial rental rate for new tenant',
      createdAt: '2022-01-15T00:00:00.000Z'
    },
    {
      id: 2,
      propertyAddress: '456 Oak Street, Vancouver, BC',
      increaseDate: '2023-01-15',
      previousRate: 2300,
      newRate: 2500,
      notes: 'Annual rate increase per BC rental guidelines',
      createdAt: '2023-01-15T00:00:00.000Z'
    }
  ],
  '789 Pine Avenue, Vancouver, BC': [
    {
      id: 4,
      propertyAddress: '789 Pine Avenue, Vancouver, BC',
      increaseDate: '2022-03-01',
      previousRate: 0,
      newRate: 2000,
      notes: 'Initial rental rate',
      createdAt: '2022-03-01T00:00:00.000Z'
    },
    {
      id: 5,
      propertyAddress: '789 Pine Avenue, Vancouver, BC',
      increaseDate: '2023-03-01',
      previousRate: 2000,
      newRate: 2200,
      notes: 'Rate increase with property improvements',
      createdAt: '2023-03-01T00:00:00.000Z'
    }
  ]
};

// Helper function to add rental history entry
const addRentalHistoryEntry = (propertyAddress, entry) => {
  if (!rentalHistoryData[propertyAddress]) {
    rentalHistoryData[propertyAddress] = [];
  }
  
  const newEntry = {
    id: Date.now(),
    propertyAddress,
    ...entry,
    createdAt: new Date().toISOString()
  };
  
  rentalHistoryData[propertyAddress].push(newEntry);
  return newEntry;
};

// Magic link authentication endpoints
app.post('/api/auth/magic-link', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔗 Magic link request for email:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in our system
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('❌ User not found for email:', email);
      // Don't reveal that user doesn't exist for security
      return res.json({ 
        success: true, 
        message: 'If your email is registered, you will receive a login link shortly.' 
      });
    }

    if (user.status !== 'active') {
      console.log('❌ User account is not active:', email);
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Generate magic token
    const token = generateMagicToken();
    const tokenData = {
      userId: user.id,
      email: user.email,
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };
    
    magicTokens.set(token, tokenData);
    
    // Send magic link email
    const emailSent = await sendMagicLink(email, token);
    
    if (emailSent) {
      console.log('✅ Magic link sent to:', email);
      res.json({ 
        success: true, 
        message: 'Login link sent to your email address' 
      });
    } else {
      console.error('❌ Failed to send magic link to:', email);
      res.status(500).json({ error: 'Failed to send login link' });
    }
    
  } catch (error) {
    console.error('Magic link request error:', error);
    res.status(500).json({ error: 'Login link request failed' });
  }
});

app.get('/auth/magic', async (req, res) => {
  try {
    const { token } = req.query;
    
    console.log('🔗 Magic link authentication attempt with token:', token);
    
    if (!token) {
      return res.status(400).send('Invalid or missing token');
    }

    const tokenData = magicTokens.get(token);
    if (!tokenData) {
      console.log('❌ Invalid magic token:', token);
      return res.status(400).send('Invalid or expired login link');
    }

    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      console.log('❌ Expired magic token:', token);
      magicTokens.delete(token);
      return res.status(400).send('Login link has expired. Please request a new one.');
    }

    // Get user
    const user = await getUserById(tokenData.userId);
    if (!user || user.status !== 'active') {
      console.log('❌ User not found or inactive for token:', token);
      magicTokens.delete(token);
      return res.status(400).send('User account not found or inactive');
    }

    // Set session
    req.session.simpleAuth = {
      userId: user.id,
      email: user.email,
      loginTime: Date.now()
    };

    // Update last login time
    await updateUser(user.id, { lastLoginAt: new Date() });

    // Clean up used token
    magicTokens.delete(token);

    console.log('✅ Magic link authentication successful for:', user.email);
    
    // Redirect to dashboard
    res.redirect('/');
    
  } catch (error) {
    console.error('Magic link authentication error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Simple auth login endpoint (emergency backup)
app.post('/api/simple/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔑 Simple login attempt for user:', username);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check for the super admin account using environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminUsername || !adminPassword) {
      console.error('❌ Admin credentials not configured properly');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    console.log('🔍 Checking credentials for user:', username);
    
    if (username === adminUsername && password === adminPassword) {
      console.log('✅ Credentials match, setting session');
      
      // Set session
      req.session.simpleAuth = {
        userId: adminUser.id,
        email: adminUser.email,
        loginTime: Date.now()
      };

      console.log('🟢 Simple auth login successful for admin');
      return res.json({ success: true, user: adminUser });
    }

    console.log('❌ Invalid credentials provided');
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Simple auth login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoints (both GET and POST for compatibility)
app.get('/api/logout', (req, res) => {
  if (req.session.simpleAuth) {
    delete req.session.simpleAuth;
  }
  // Redirect to landing page after logout
  res.redirect('/');
});

app.post('/api/simple/logout', (req, res) => {
  if (req.session.simpleAuth) {
    delete req.session.simpleAuth;
  }
  res.json({ success: true });
});

// Auth check endpoint
app.get('/api/auth/user', async (req, res) => {
  console.log('✅ Auth check');
  if (req.session.simpleAuth) {
    const user = await getUserById(req.session.simpleAuth.userId);
    if (user && user.status === 'active') {
      // Return user without sensitive data
      const { ...userData } = user;
      res.json(userData);
    } else {
      res.status(401).json({ error: 'User not found or inactive' });
    }
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Properties API
app.get('/api/properties', (req, res) => {
  console.log('📋 Properties API called');
  res.json(propertiesData);
});

// Individual property details API
app.get('/api/properties/:propertyAddress', (req, res) => {
  const propertyAddress = decodeURIComponent(req.params.propertyAddress);
  console.log('🏠 Property details for:', propertyAddress);
  
  const property = propertiesData.find(p => p.propertyAddress === propertyAddress);
  
  if (property) {
    res.json(property);
  } else {
    res.status(404).json({ error: 'Property not found' });
  }
});

// Rental history API
app.get('/api/rental-history/:propertyAddress', (req, res) => {
  const propertyAddress = decodeURIComponent(req.params.propertyAddress);
  console.log('📊 Rental history for:', propertyAddress);
  
  const history = rentalHistoryData[propertyAddress] || [];
  res.json(history);
});

// MAIN RENTAL INCREASE PROCESSING ENDPOINT
app.post('/api/process-rental-increase', (req, res) => {
  try {
    const { propertyAddress, increaseDate, newRate, notes } = req.body;
    
    console.log('💰 Processing rental increase for:', propertyAddress);
    console.log('Data:', { increaseDate, newRate, notes });
    
    // Validation
    if (!propertyAddress || !increaseDate || !newRate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (newRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'New rate must be positive'
      });
    }
    
    // Get current rental info
    const currentRentalInfo = rentalRateIncreases.get(propertyAddress);
    
    if (!currentRentalInfo) {
      return res.status(404).json({
        success: false,
        message: 'No rental rate information found for this property'
      });
    }
    
    const previousRate = currentRentalInfo.latestRentalRate;
    
    // Add to rental history
    const historyEntry = addRentalHistoryEntry(propertyAddress, {
      increaseDate,
      previousRate,
      newRate,
      notes: notes || 'Rate increase processed via dashboard'
    });
    
    // Calculate next allowable increase date (1 year from increase date)
    const nextDate = new Date(increaseDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    
    // Calculate reminder date (9 months from increase date)
    const reminderDate = new Date(increaseDate);
    reminderDate.setMonth(reminderDate.getMonth() + 9);
    
    // Update rental rate increases
    const updatedRentalInfo = {
      ...currentRentalInfo,
      latestRentalRate: newRate,
      latestRateIncreaseDate: increaseDate,
      nextAllowableRentalIncreaseDate: nextDate.toISOString().split('T')[0],
      nextAllowableRentalRate: Math.round(newRate * 1.03),
      reminderDate: reminderDate.toISOString().split('T')[0]
    };
    
    rentalRateIncreases.set(propertyAddress, updatedRentalInfo);
    
    // Update property data
    const propertyIndex = propertiesData.findIndex(p => p.propertyAddress === propertyAddress);
    if (propertyIndex !== -1) {
      propertiesData[propertyIndex].rentalInfo = updatedRentalInfo;
    }
    
    console.log('✅ Rental increase processed successfully');
    
    res.json({
      success: true,
      message: 'Rental increase processed successfully',
      data: updatedRentalInfo,
      historyEntry
    });
    
  } catch (error) {
    console.error('❌ Error processing rental increase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process rental increase',
      error: error.message
    });
  }
});

// Get rental increases by address
app.get('/api/rental-increases/:address', (req, res) => {
  const address = decodeURIComponent(req.params.address);
  console.log('📊 Rental increase info for:', address);
  
  const rentalInfo = rentalRateIncreases.get(address);
  
  if (rentalInfo) {
    res.json(rentalInfo);
  } else {
    res.status(404).json({ error: 'Rental increase information not found' });
  }
});

// User management APIs (Admin only)
app.get('/api/users', async (req, res) => {
  console.log('👥 Users API called');
  
  // Check if user is authenticated and is admin
  if (!req.session.simpleAuth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const currentUser = await getUserById(req.session.simpleAuth.userId);
  if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Return all users (without sensitive data)
  const allUsers = await getAllUsers();
  const userList = allUsers.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  }));
  
  res.json(userList);
});

app.post('/api/users', async (req, res) => {
  console.log('👤 Create user request');
  
  // Check authentication and permissions
  if (!req.session.simpleAuth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const currentUser = await getUserById(req.session.simpleAuth.userId);
  if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  const { email, firstName, lastName, role } = req.body;
  
  // Validation
  if (!email || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (!Object.values(USER_ROLES).includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }
  
  // Create new user
  const newUser = await createUser({
    email: email.toLowerCase().trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    role: role,
    status: 'active'
  });
  
  console.log('✅ User created:', newUser.email);
  
  // Return user without sensitive data
  const { ...userData } = newUser;
  res.json(userData);
});

app.put('/api/users/:userId', async (req, res) => {
  console.log('👤 Update user request for:', req.params.userId);
  
  // Check authentication and permissions
  if (!req.session.simpleAuth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const currentUser = await getUserById(req.session.simpleAuth.userId);
  if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  const { userId } = req.params;
  const { email, firstName, lastName, role, status } = req.body;
  
  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Prevent admin from deactivating themselves
  if (userId === currentUser.id && status === 'inactive') {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }
  
  // Prepare updates
  const updates = {};
  if (email) updates.email = email.toLowerCase().trim();
  if (firstName) updates.firstName = firstName.trim();
  if (lastName) updates.lastName = lastName.trim();
  if (role && Object.values(USER_ROLES).includes(role)) updates.role = role;
  if (status && ['active', 'inactive'].includes(status)) updates.status = status;
  
  // Update user
  const updatedUser = await updateUser(userId, updates);
  
  console.log('✅ User updated:', updatedUser.email);
  
  // Return updated user
  const { ...userData } = updatedUser;
  res.json(userData);
});

app.delete('/api/users/:userId', async (req, res) => {
  console.log('👤 Delete user request for:', req.params.userId);
  
  // Check authentication and permissions
  if (!req.session.simpleAuth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const currentUser = await getUserById(req.session.simpleAuth.userId);
  if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  const { userId } = req.params;
  
  // Prevent admin from deleting themselves
  if (userId === currentUser.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  await deleteUser(userId);
  console.log('✅ User deleted:', user.email);
  
  res.json({ success: true, message: 'User deleted successfully' });
});

// Other APIs
app.get('/api/reminders/birthdays', (req, res) => {
  res.json([
    { name: 'Jane Smith', role: 'Tenant', birthday: '1985-07-09T00:00:00.000Z', contactNumber: '604-555-1111', propertyAddress: '456 Oak Street, Vancouver, BC' }
  ]);
});

app.get('/api/reminders/rental-increases', (req, res) => {
  const reminders = Array.from(rentalRateIncreases.values());
  res.json(reminders);
});

// Property/Landlord management endpoints
app.get('/api/landlords', (req, res) => {
  console.log('🏠 Get all landlords/properties');
  res.json(propertiesData);
});

app.post('/api/landlords', async (req, res) => {
  try {
    console.log('🏠 Create new property/landlord:', req.body);
    
    const { propertyAddress, keyNumber, serviceType, strataContactNumber, strataManagementCompany, strataContactPerson } = req.body;
    
    // Validation
    if (!propertyAddress || !keyNumber || !serviceType) {
      return res.status(400).json({ error: 'Property address, key number, and service type are required' });
    }
    
    // Check if property already exists
    const existingProperty = propertiesData.find(p => p.propertyAddress === propertyAddress);
    if (existingProperty) {
      return res.status(409).json({ error: 'Property with this address already exists' });
    }
    
    // Create new property
    const newProperty = {
      id: Date.now(), // Add unique ID for landlord association
      propertyAddress,
      keyNumber,
      serviceType,
      strataContactNumber: strataContactNumber || null,
      strataManagementCompany: strataManagementCompany || null,
      strataContactPerson: strataContactPerson || null,
      landlordOwners: [], // Will be populated separately if needed
      tenant: null,
      activeTenants: [],
      tenantHistory: [],
      rentalInfo: null
    };
    
    propertiesData.push(newProperty);
    
    console.log('✅ Property created successfully:', propertyAddress);
    res.status(201).json(newProperty);
    
  } catch (error) {
    console.error('❌ Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

app.put('/api/landlords/:propertyAddress', async (req, res) => {
  try {
    const propertyAddress = decodeURIComponent(req.params.propertyAddress);
    console.log('🏠 Update property:', propertyAddress);
    
    const { keyNumber, serviceType, strataContactNumber, strataManagementCompany, strataContactPerson } = req.body;
    
    // Find property
    const propertyIndex = propertiesData.findIndex(p => p.propertyAddress === propertyAddress);
    if (propertyIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Update property
    const updatedProperty = {
      ...propertiesData[propertyIndex],
      keyNumber: keyNumber || propertiesData[propertyIndex].keyNumber,
      serviceType: serviceType || propertiesData[propertyIndex].serviceType,
      strataContactNumber: strataContactNumber || propertiesData[propertyIndex].strataContactNumber,
      strataManagementCompany: strataManagementCompany || propertiesData[propertyIndex].strataManagementCompany,
      strataContactPerson: strataContactPerson || propertiesData[propertyIndex].strataContactPerson
    };
    
    propertiesData[propertyIndex] = updatedProperty;
    
    console.log('✅ Property updated successfully:', propertyAddress);
    res.json(updatedProperty);
    
  } catch (error) {
    console.error('❌ Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Tenant management endpoints
app.get('/api/tenants', (req, res) => {
  console.log('👥 Get all tenants');
  
  // Extract all tenants from all properties
  const allTenants = [];
  propertiesData.forEach(property => {
    if (property.activeTenants && property.activeTenants.length > 0) {
      property.activeTenants.forEach(tenant => {
        allTenants.push({
          ...tenant,
          propertyAddress: property.propertyAddress,
          serviceType: property.serviceType
        });
      });
    }
  });
  
  res.json(allTenants);
});

app.post('/api/tenants', async (req, res) => {
  try {
    console.log('👤 Create new tenant:', req.body);
    
    const { propertyAddress, serviceType, moveInDate, moveOutDate, name, contactNumber, email, birthday, isPrimary } = req.body;
    
    // Validation
    if (!propertyAddress || !name || !moveInDate) {
      return res.status(400).json({ error: 'Property address, tenant name, and move-in date are required' });
    }
    
    // Find property
    const propertyIndex = propertiesData.findIndex(p => p.propertyAddress === propertyAddress);
    if (propertyIndex === -1) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Create new tenant
    const newTenant = {
      id: Date.now(), // Simple ID generation
      propertyAddress,
      serviceType: serviceType || propertiesData[propertyIndex].serviceType,
      moveInDate,
      moveOutDate: moveOutDate || null,
      name,
      contactNumber: contactNumber || null,
      email: email || null,
      birthday: birthday || null,
      isPrimary: isPrimary || false
    };
    
    // Add tenant to property
    if (!propertiesData[propertyIndex].activeTenants) {
      propertiesData[propertyIndex].activeTenants = [];
    }
    propertiesData[propertyIndex].activeTenants.push(newTenant);
    
    // Set as primary tenant if it's the first one or if specified
    if (propertiesData[propertyIndex].activeTenants.length === 1 || isPrimary) {
      propertiesData[propertyIndex].tenant = newTenant;
    }
    
    console.log('✅ Tenant created successfully:', name);
    res.status(201).json(newTenant);
    
  } catch (error) {
    console.error('❌ Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

app.get('/api/tenants/:propertyAddress', (req, res) => {
  try {
    const propertyAddress = decodeURIComponent(req.params.propertyAddress);
    console.log('👥 Get tenants for property:', propertyAddress);
    
    // Find property
    const property = propertiesData.find(p => p.propertyAddress === propertyAddress);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Return active tenants for this property
    const tenants = property.activeTenants || [];
    res.json(tenants);
    
  } catch (error) {
    console.error('❌ Error getting tenants for property:', error);
    res.status(500).json({ error: 'Failed to get tenants for property' });
  }
});

app.put('/api/tenants/:tenantId', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    console.log('👤 Update tenant:', tenantId);
    
    const { name, contactNumber, email, birthday, moveInDate, moveOutDate, isPrimary } = req.body;
    
    // Find property containing this tenant
    let targetProperty = null;
    let tenantIndex = -1;
    
    for (const property of propertiesData) {
      if (property.activeTenants) {
        const index = property.activeTenants.findIndex(tenant => tenant.id === tenantId);
        if (index !== -1) {
          targetProperty = property;
          tenantIndex = index;
          break;
        }
      }
    }
    
    if (!targetProperty || tenantIndex === -1) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Update tenant
    const updatedTenant = {
      ...targetProperty.activeTenants[tenantIndex],
      name: name || targetProperty.activeTenants[tenantIndex].name,
      contactNumber: contactNumber || targetProperty.activeTenants[tenantIndex].contactNumber,
      email: email || targetProperty.activeTenants[tenantIndex].email,
      birthday: birthday || targetProperty.activeTenants[tenantIndex].birthday,
      moveInDate: moveInDate || targetProperty.activeTenants[tenantIndex].moveInDate,
      moveOutDate: moveOutDate || targetProperty.activeTenants[tenantIndex].moveOutDate,
      isPrimary: isPrimary !== undefined ? isPrimary : targetProperty.activeTenants[tenantIndex].isPrimary
    };
    
    targetProperty.activeTenants[tenantIndex] = updatedTenant;
    
    // Update primary tenant if needed
    if (isPrimary) {
      targetProperty.tenant = updatedTenant;
    }
    
    console.log('✅ Tenant updated successfully:', name);
    res.json(updatedTenant);
    
  } catch (error) {
    console.error('❌ Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

app.delete('/api/tenants/:tenantId', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    console.log('🗑️ Delete tenant:', tenantId);
    
    // Find property containing this tenant
    let targetProperty = null;
    let tenantIndex = -1;
    
    for (const property of propertiesData) {
      if (property.activeTenants) {
        const index = property.activeTenants.findIndex(tenant => tenant.id === tenantId);
        if (index !== -1) {
          targetProperty = property;
          tenantIndex = index;
          break;
        }
      }
    }
    
    if (!targetProperty || tenantIndex === -1) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Remove tenant
    const removedTenant = targetProperty.activeTenants.splice(tenantIndex, 1)[0];
    
    // If this was the primary tenant, set a new primary tenant or clear it
    if (targetProperty.tenant && targetProperty.tenant.id === tenantId) {
      if (targetProperty.activeTenants.length > 0) {
        targetProperty.tenant = targetProperty.activeTenants[0];
        targetProperty.activeTenants[0].isPrimary = true;
      } else {
        targetProperty.tenant = null;
      }
    }
    
    console.log('✅ Tenant deleted successfully');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// Landlord owner management endpoints
app.get('/api/landlords/:propertyAddress/owners', (req, res) => {
  try {
    const propertyAddress = decodeURIComponent(req.params.propertyAddress);
    console.log('👥 Get landlord owners for property:', propertyAddress);
    
    // Find property
    const property = propertiesData.find(p => p.propertyAddress === propertyAddress);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Return landlord owners with IDs
    const owners = property.landlordOwners || [];
    const ownersWithIds = owners.map((owner, index) => ({
      id: owner.id || index + 1, // Ensure each owner has an ID
      ...owner
    }));
    
    res.json(ownersWithIds);
    
  } catch (error) {
    console.error('❌ Error getting landlord owners:', error);
    res.status(500).json({ error: 'Failed to get landlord owners' });
  }
});

app.post('/api/landlord-owners', async (req, res) => {
  try {
    console.log('👤 Create new landlord owner:', req.body);
    
    const { landlordId, propertyAddress, name, contactNumber, birthday, residentialAddress } = req.body;
    
    // Find property by landlordId, propertyAddress, or most recent
    let targetProperty = null;
    
    // Try to find by landlordId first
    if (landlordId) {
      targetProperty = propertiesData.find(p => p.id === landlordId);
    }
    
    // If not found and propertyAddress provided, find by address
    if (!targetProperty && propertyAddress) {
      targetProperty = propertiesData.find(p => p.propertyAddress === propertyAddress);
    }
    
    // If still not found, find by the most recently created property (fallback)
    if (!targetProperty && propertiesData.length > 0) {
      targetProperty = propertiesData[propertiesData.length - 1];
    }
    
    if (!targetProperty) {
      return res.status(404).json({ error: 'No property found to associate owner with' });
    }
    
    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Owner name is required' });
    }
    
    // Create new owner
    const newOwner = {
      id: Date.now(), // Simple ID generation
      name,
      contactNumber: contactNumber || null,
      birthday: birthday || null,
      residentialAddress: residentialAddress || null
    };
    
    // Add owner to property
    if (!targetProperty.landlordOwners) {
      targetProperty.landlordOwners = [];
    }
    targetProperty.landlordOwners.push(newOwner);
    
    console.log('✅ Landlord owner created successfully:', name);
    res.status(201).json(newOwner);
    
  } catch (error) {
    console.error('❌ Error creating landlord owner:', error);
    res.status(500).json({ error: 'Failed to create landlord owner' });
  }
});

app.put('/api/landlord-owners/:ownerId', async (req, res) => {
  try {
    const ownerId = parseInt(req.params.ownerId);
    console.log('👤 Update landlord owner:', ownerId);
    
    const { name, contactNumber, birthday, residentialAddress } = req.body;
    
    // Find property containing this owner
    let targetProperty = null;
    let ownerIndex = -1;
    
    for (const property of propertiesData) {
      if (property.landlordOwners) {
        const index = property.landlordOwners.findIndex(owner => owner.id === ownerId);
        if (index !== -1) {
          targetProperty = property;
          ownerIndex = index;
          break;
        }
      }
    }
    
    if (!targetProperty || ownerIndex === -1) {
      return res.status(404).json({ error: 'Landlord owner not found' });
    }
    
    // Update owner
    const updatedOwner = {
      ...targetProperty.landlordOwners[ownerIndex],
      name: name || targetProperty.landlordOwners[ownerIndex].name,
      contactNumber: contactNumber || targetProperty.landlordOwners[ownerIndex].contactNumber,
      birthday: birthday || targetProperty.landlordOwners[ownerIndex].birthday,
      residentialAddress: residentialAddress || targetProperty.landlordOwners[ownerIndex].residentialAddress
    };
    
    targetProperty.landlordOwners[ownerIndex] = updatedOwner;
    
    console.log('✅ Landlord owner updated successfully:', name);
    res.json(updatedOwner);
    
  } catch (error) {
    console.error('❌ Error updating landlord owner:', error);
    res.status(500).json({ error: 'Failed to update landlord owner' });
  }
});

app.delete('/api/landlord-owners/:ownerId', async (req, res) => {
  try {
    const ownerId = parseInt(req.params.ownerId);
    console.log('🗑️ Delete landlord owner:', ownerId);
    
    // Find property containing this owner
    let targetProperty = null;
    let ownerIndex = -1;
    
    for (const property of propertiesData) {
      if (property.landlordOwners) {
        const index = property.landlordOwners.findIndex(owner => owner.id === ownerId);
        if (index !== -1) {
          targetProperty = property;
          ownerIndex = index;
          break;
        }
      }
    }
    
    if (!targetProperty || ownerIndex === -1) {
      return res.status(404).json({ error: 'Landlord owner not found' });
    }
    
    // Remove owner
    targetProperty.landlordOwners.splice(ownerIndex, 1);
    
    console.log('✅ Landlord owner deleted successfully');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error deleting landlord owner:', error);
    res.status(500).json({ error: 'Failed to delete landlord owner' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', rentalIncreases: 'enabled' });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    console.log('❌ API 404:', req.path);
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🌐 Server listening on port ${PORT}`);
  console.log('🚀 PropertyLinkPro with Rental Increase Processing (Database Mode)');
  console.log('✅ POST /api/process-rental-increase endpoint ready');
  console.log('💰 Rental increase processing should now work');
  
  // Setup email transporter
  try {
    await setupEmailTransporter();
    console.log('✅ Email transporter configured');
  } catch (error) {
    console.error('❌ Failed to setup email transporter:', error);
  }
  
  // Initialize database if needed
  await initializeDatabase();
  
  // Initialize users
  try {
    await initializeSampleUsers();
    if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
      console.log('👥 Sample users available:');
      console.log('   📧 admin@instarealty.com (Admin)');
      console.log('   📧 sarah.manager@company.com (Manager)');
      console.log('   📧 john.staff@company.com (Staff)');
    } else {
      console.log('🗄️ Database mode: Users will persist across restarts');
      console.log('   📧 Default admin: admin@instarealty.com (Admin)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize users:', error);
  }
});

export default app;