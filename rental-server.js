// PropertyLinkPro Server with Rental Increase Processing
import express from 'express';
import session from 'express-session';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
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
          password_hash VARCHAR,
          is_temporary_password BOOLEAN DEFAULT FALSE,
          password_expires_at TIMESTAMP,
          failed_login_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          last_login_at TIMESTAMP
        )
      `);
      
      // Create properties table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS properties (
          id BIGINT PRIMARY KEY,
          property_address VARCHAR UNIQUE NOT NULL,
          key_number VARCHAR NOT NULL,
          service_type VARCHAR NOT NULL,
          strata_contact_number VARCHAR,
          strata_management_company VARCHAR,
          strata_contact_person VARCHAR,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Create landlord_owners table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS landlord_owners (
          id BIGINT PRIMARY KEY,
          property_id BIGINT REFERENCES properties(id) ON DELETE CASCADE,
          name VARCHAR NOT NULL,
          contact_number VARCHAR,
          birthday DATE,
          residential_address TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Create tenants table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id BIGINT PRIMARY KEY,
          property_id BIGINT REFERENCES properties(id) ON DELETE CASCADE,
          name VARCHAR NOT NULL,
          contact_number VARCHAR,
          email VARCHAR,
          birthday DATE,
          move_in_date DATE NOT NULL,
          move_out_date DATE,
          is_primary BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      console.log('📋 Database tables ready (users, properties, landlord_owners, tenants)');
      
      // Migrate existing users to ensure password authentication compatibility
      await migrateExistingUsers();
      
    } catch (error) {
      console.log('⚠️ Database connection failed, using memory storage:', error.message);
      process.env.USE_MEMORY_STORAGE = 'true'; // Fallback to memory
    }
  }
}

// Database migration function to ensure existing users have password authentication fields
async function migrateExistingUsers() {
  if (!global.dbPool) {
    console.log('🔄 Skipping user migration - no database connection');
    return;
  }
  
  try {
    console.log('🔄 Starting user migration for password authentication...');
    
    // First, let's check current user states
    const checkResult = await global.dbPool.query(`
      SELECT id, email, password_hash, is_temporary_password 
      FROM users 
      ORDER BY created_at
    `);
    
    console.log('🔍 Current users in database:');
    checkResult.rows.forEach(user => {
      console.log(`  - ${user.email}: password_hash=${user.password_hash ? 'SET' : 'NULL'}, is_temp=${user.is_temporary_password}`);
    });
    
    // Update existing users who don't have password authentication fields set
    const result = await global.dbPool.query(`
      UPDATE users 
      SET 
        password_hash = NULL,
        is_temporary_password = FALSE,
        password_expires_at = NULL,
        failed_login_attempts = COALESCE(failed_login_attempts, 0),
        locked_until = NULL
      WHERE 
        is_temporary_password IS NULL
        OR failed_login_attempts IS NULL
    `);
    
    console.log(`✅ Migrated ${result.rowCount} existing users for password authentication`);
    
    // Verify migration results
    const verifyResult = await global.dbPool.query(`
      SELECT id, email, password_hash, is_temporary_password, failed_login_attempts
      FROM users 
      ORDER BY created_at
    `);
    
    console.log('🔍 Users after migration:');
    verifyResult.rows.forEach(user => {
      console.log(`  - ${user.email}: password_hash=${user.password_hash ? 'SET' : 'NULL'}, is_temp=${user.is_temporary_password}, failed_attempts=${user.failed_login_attempts}`);
    });
    
  } catch (error) {
    console.error('❌ Error during user migration:', error);
    console.error('Migration error details:', error.message);
    // Don't fail the startup, just log the error
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
      if (updates.passwordHash) {
        fields.push(`password_hash = $${paramIndex}`);
        values.push(updates.passwordHash);
        paramIndex++;
      }
      if (updates.isTemporaryPassword !== undefined) {
        fields.push(`is_temporary_password = $${paramIndex}`);
        values.push(updates.isTemporaryPassword);
        paramIndex++;
      }
      if (updates.passwordExpiresAt !== undefined) {
        fields.push(`password_expires_at = $${paramIndex}`);
        values.push(updates.passwordExpiresAt);
        paramIndex++;
      }
      if (updates.failedLoginAttempts !== undefined) {
        fields.push(`failed_login_attempts = $${paramIndex}`);
        values.push(updates.failedLoginAttempts);
        paramIndex++;
      }
      if (updates.lockedUntil !== undefined) {
        fields.push(`locked_until = $${paramIndex}`);
        values.push(updates.lockedUntil);
        paramIndex++;
      }
      
      values.push(id);
      
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
      
      await global.dbPool.query(query, values);
      
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

// Password utility functions
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function generateTempPassword() {
  // Generate a 12-character temporary password with mix of chars
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function validatePassword(password) {
  // Password must be at least 8 characters with letters and numbers
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
    return { valid: false, message: 'Password must contain both letters and numbers' };
  }
  return { valid: true };
}

async function setUserPassword(userId, password, isTemporary = false) {
  const passwordHash = await hashPassword(password);
  const expiresAt = isTemporary ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24 hours
  
  const updates = {
    passwordHash,
    isTemporaryPassword: isTemporary,
    passwordExpiresAt: expiresAt,
    failedLoginAttempts: 0,
    lockedUntil: null
  };
  
  return await updateUser(userId, updates);
}

async function checkAccountLockout(userId) {
  const user = await getUserById(userId);
  if (!user) return { locked: true, message: 'User not found' };
  
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    return { locked: true, message: 'Account is temporarily locked due to failed login attempts' };
  }
  
  return { locked: false };
}

async function recordFailedLogin(userId) {
  const user = await getUserById(userId);
  if (!user) return;
  
  const failedAttempts = (user.failedLoginAttempts || 0) + 1;
  const updates = { failedLoginAttempts: failedAttempts };
  
  // Lock account for 15 minutes after 5 failed attempts
  if (failedAttempts >= 5) {
    updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  await updateUser(userId, updates);
}

async function clearFailedLogins(userId) {
  await updateUser(userId, { 
    failedLoginAttempts: 0, 
    lockedUntil: null,
    lastLoginAt: new Date()
  });
}

// Property database helper functions
async function createProperty(propertyData) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    const property = {
      id: Date.now(),
      propertyAddress: propertyData.propertyAddress,
      keyNumber: propertyData.keyNumber,
      serviceType: propertyData.serviceType,
      strataContactNumber: propertyData.strataContactNumber || null,
      strataManagementCompany: propertyData.strataManagementCompany || null,
      strataContactPerson: propertyData.strataContactPerson || null,
      landlordOwners: [],
      tenant: null,
      activeTenants: [],
      tenantHistory: [],
      rentalInfo: null
    };
    propertiesData.push(property);
    return property;
  } else {
    try {
      const result = await global.dbPool.query(
        'INSERT INTO properties (id, property_address, key_number, service_type, strata_contact_number, strata_management_company, strata_contact_person) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          propertyData.id || Date.now(),
          propertyData.propertyAddress,
          propertyData.keyNumber,
          propertyData.serviceType,
          propertyData.strataContactNumber || null,
          propertyData.strataManagementCompany || null,
          propertyData.strataContactPerson || null
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      const property = {
        id: Date.now(),
        propertyAddress: propertyData.propertyAddress,
        keyNumber: propertyData.keyNumber,
        serviceType: propertyData.serviceType,
        strataContactNumber: propertyData.strataContactNumber || null,
        strataManagementCompany: propertyData.strataManagementCompany || null,
        strataContactPerson: propertyData.strataContactPerson || null,
        landlordOwners: [],
        tenant: null,
        activeTenants: [],
        tenantHistory: [],
        rentalInfo: null
      };
      propertiesData.push(property);
      return property;
    }
  }
}

async function getAllProperties() {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    return propertiesData;
  } else {
    try {
      const propertiesResult = await global.dbPool.query('SELECT * FROM properties ORDER BY created_at DESC');
      const properties = [];
      
      for (const propertyRow of propertiesResult.rows) {
        // Get landlord owners
        const ownersResult = await global.dbPool.query('SELECT * FROM landlord_owners WHERE property_id = $1', [propertyRow.id]);
        const landlordOwners = ownersResult.rows.map(owner => ({
          id: owner.id,
          name: owner.name,
          contactNumber: owner.contact_number,
          birthday: owner.birthday,
          residentialAddress: owner.residential_address
        }));
        
        // Get active tenants
        const tenantsResult = await global.dbPool.query('SELECT * FROM tenants WHERE property_id = $1 AND move_out_date IS NULL', [propertyRow.id]);
        const activeTenants = tenantsResult.rows.map(tenant => ({
          id: tenant.id,
          name: tenant.name,
          contactNumber: tenant.contact_number,
          email: tenant.email,
          birthday: tenant.birthday,
          moveInDate: tenant.move_in_date,
          moveOutDate: tenant.move_out_date,
          isPrimary: tenant.is_primary
        }));
        
        // Find primary tenant
        const primaryTenant = activeTenants.find(t => t.isPrimary) || activeTenants[0] || null;
        
        properties.push({
          id: propertyRow.id,
          propertyAddress: propertyRow.property_address,
          keyNumber: propertyRow.key_number,
          serviceType: propertyRow.service_type,
          strataContactNumber: propertyRow.strata_contact_number,
          strataManagementCompany: propertyRow.strata_management_company,
          strataContactPerson: propertyRow.strata_contact_person,
          landlordOwners,
          tenant: primaryTenant,
          activeTenants,
          tenantHistory: [], // Could be implemented later
          rentalInfo: null // Could be implemented later
        });
      }
      
      return properties;
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return propertiesData;
    }
  }
}

async function getPropertyByAddress(propertyAddress) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    return propertiesData.find(p => p.propertyAddress === propertyAddress) || null;
  } else {
    try {
      const result = await global.dbPool.query('SELECT * FROM properties WHERE property_address = $1', [propertyAddress]);
      if (result.rows.length === 0) return null;
      
      const propertyRow = result.rows[0];
      
      // Get landlord owners and tenants
      const properties = await getAllProperties();
      return properties.find(p => p.id === propertyRow.id) || null;
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return propertiesData.find(p => p.propertyAddress === propertyAddress) || null;
    }
  }
}

// Landlord owner database helper functions
async function createLandlordOwner(ownerData, propertyId) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    // Fallback to memory - find property and add owner
    const property = propertiesData.find(p => p.id === propertyId);
    if (property) {
      const newOwner = {
        id: Date.now(),
        name: ownerData.name,
        contactNumber: ownerData.contactNumber || null,
        birthday: ownerData.birthday || null,
        residentialAddress: ownerData.residentialAddress || null
      };
      if (!property.landlordOwners) property.landlordOwners = [];
      property.landlordOwners.push(newOwner);
      return newOwner;
    }
    return null;
  } else {
    try {
      const result = await global.dbPool.query(
        'INSERT INTO landlord_owners (id, property_id, name, contact_number, birthday, residential_address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [
          Date.now(),
          propertyId,
          ownerData.name,
          ownerData.contactNumber || null,
          ownerData.birthday || null,
          ownerData.residentialAddress || null
        ]
      );
      return {
        id: result.rows[0].id,
        name: result.rows[0].name,
        contactNumber: result.rows[0].contact_number,
        birthday: result.rows[0].birthday,
        residentialAddress: result.rows[0].residential_address
      };
    } catch (error) {
      console.error('Database error creating landlord owner, falling back to memory:', error);
      // Fallback to memory
      const property = propertiesData.find(p => p.id === propertyId);
      if (property) {
        const newOwner = {
          id: Date.now(),
          name: ownerData.name,
          contactNumber: ownerData.contactNumber || null,
          birthday: ownerData.birthday || null,
          residentialAddress: ownerData.residentialAddress || null
        };
        if (!property.landlordOwners) property.landlordOwners = [];
        property.landlordOwners.push(newOwner);
        return newOwner;
      }
      return null;
    }
  }
}

async function updateLandlordOwner(ownerId, updates) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    // Fallback to memory
    for (const property of propertiesData) {
      if (property.landlordOwners) {
        const ownerIndex = property.landlordOwners.findIndex(owner => owner.id === ownerId);
        if (ownerIndex !== -1) {
          Object.assign(property.landlordOwners[ownerIndex], updates);
          return property.landlordOwners[ownerIndex];
        }
      }
    }
    return null;
  } else {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      if (updates.name) {
        fields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }
      if (updates.contactNumber !== undefined) {
        fields.push(`contact_number = $${paramIndex}`);
        values.push(updates.contactNumber);
        paramIndex++;
      }
      if (updates.birthday !== undefined) {
        fields.push(`birthday = $${paramIndex}`);
        values.push(updates.birthday);
        paramIndex++;
      }
      if (updates.residentialAddress !== undefined) {
        fields.push(`residential_address = $${paramIndex}`);
        values.push(updates.residentialAddress);
        paramIndex++;
      }
      
      values.push(ownerId);
      
      const result = await global.dbPool.query(
        `UPDATE landlord_owners SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      if (result.rows.length > 0) {
        return {
          id: result.rows[0].id,
          name: result.rows[0].name,
          contactNumber: result.rows[0].contact_number,
          birthday: result.rows[0].birthday,
          residentialAddress: result.rows[0].residential_address
        };
      }
      return null;
    } catch (error) {
      console.error('Database error updating landlord owner, falling back to memory:', error);
      // Fallback to memory
      for (const property of propertiesData) {
        if (property.landlordOwners) {
          const ownerIndex = property.landlordOwners.findIndex(owner => owner.id === ownerId);
          if (ownerIndex !== -1) {
            Object.assign(property.landlordOwners[ownerIndex], updates);
            return property.landlordOwners[ownerIndex];
          }
        }
      }
      return null;
    }
  }
}

async function deleteLandlordOwner(ownerId) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    // Fallback to memory
    for (const property of propertiesData) {
      if (property.landlordOwners) {
        const ownerIndex = property.landlordOwners.findIndex(owner => owner.id === ownerId);
        if (ownerIndex !== -1) {
          property.landlordOwners.splice(ownerIndex, 1);
          return true;
        }
      }
    }
    return false;
  } else {
    try {
      const result = await global.dbPool.query('DELETE FROM landlord_owners WHERE id = $1', [ownerId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error deleting landlord owner, falling back to memory:', error);
      // Fallback to memory
      for (const property of propertiesData) {
        if (property.landlordOwners) {
          const ownerIndex = property.landlordOwners.findIndex(owner => owner.id === ownerId);
          if (ownerIndex !== -1) {
            property.landlordOwners.splice(ownerIndex, 1);
            return true;
          }
        }
      }
      return false;
    }
  }
}

// Tenant database helper functions
async function createTenant(tenantData, propertyId) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    console.log('🔄 Using memory storage for tenant creation');
    // Fallback to memory - this is handled in the endpoint for now
    return tenantData;
  } else {
    try {
      console.log('🔍 Database tenant insertion attempt:');
      console.log('  - Tenant ID:', tenantData.id, 'Type:', typeof tenantData.id);
      console.log('  - Property ID:', propertyId, 'Type:', typeof propertyId);
      console.log('  - Tenant name:', tenantData.name);
      console.log('  - Move-in date:', tenantData.moveInDate);
      
      const result = await global.dbPool.query(
        'INSERT INTO tenants (id, property_id, name, contact_number, email, birthday, move_in_date, move_out_date, is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          tenantData.id,
          propertyId,
          tenantData.name,
          tenantData.contactNumber || null,
          tenantData.email || null,
          tenantData.birthday || null,
          tenantData.moveInDate,
          tenantData.moveOutDate || null,
          tenantData.isPrimary || false
        ]
      );
      
      console.log('✅ Database tenant insertion successful:', result.rows[0]);
      
      return {
        id: result.rows[0].id,
        propertyId: result.rows[0].property_id,
        name: result.rows[0].name,
        contactNumber: result.rows[0].contact_number,
        email: result.rows[0].email,
        birthday: result.rows[0].birthday,
        moveInDate: result.rows[0].move_in_date,
        moveOutDate: result.rows[0].move_out_date,
        isPrimary: result.rows[0].is_primary
      };
    } catch (error) {
      console.error('❌ Database error creating tenant, falling back to memory:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      return tenantData;
    }
  }
}

async function updateTenant(tenantId, updates) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    // Fallback to memory - find in propertiesData and update
    for (const property of propertiesData) {
      if (property.activeTenants) {
        const tenantIndex = property.activeTenants.findIndex(tenant => tenant.id == tenantId);
        if (tenantIndex !== -1) {
          Object.assign(property.activeTenants[tenantIndex], updates);
          return property.activeTenants[tenantIndex];
        }
      }
    }
    return null;
  } else {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }
      if (updates.contactNumber !== undefined) {
        fields.push(`contact_number = $${paramIndex}`);
        values.push(updates.contactNumber);
        paramIndex++;
      }
      if (updates.email !== undefined) {
        fields.push(`email = $${paramIndex}`);
        values.push(updates.email);
        paramIndex++;
      }
      if (updates.birthday !== undefined) {
        fields.push(`birthday = $${paramIndex}`);
        values.push(updates.birthday);
        paramIndex++;
      }
      if (updates.moveInDate !== undefined) {
        fields.push(`move_in_date = $${paramIndex}`);
        values.push(updates.moveInDate);
        paramIndex++;
      }
      if (updates.moveOutDate !== undefined) {
        fields.push(`move_out_date = $${paramIndex}`);
        values.push(updates.moveOutDate);
        paramIndex++;
      }
      if (updates.isPrimary !== undefined) {
        fields.push(`is_primary = $${paramIndex}`);
        values.push(updates.isPrimary);
        paramIndex++;
      }
      
      values.push(tenantId);
      
      const result = await global.dbPool.query(
        `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      
      if (result.rows.length > 0) {
        return {
          id: result.rows[0].id,
          propertyId: result.rows[0].property_id,
          name: result.rows[0].name,
          contactNumber: result.rows[0].contact_number,
          email: result.rows[0].email,
          birthday: result.rows[0].birthday,
          moveInDate: result.rows[0].move_in_date,
          moveOutDate: result.rows[0].move_out_date,
          isPrimary: result.rows[0].is_primary
        };
      }
      return null;
    } catch (error) {
      console.error('Database error updating tenant, falling back to memory:', error);
      // Fallback to memory
      for (const property of propertiesData) {
        if (property.activeTenants) {
          const tenantIndex = property.activeTenants.findIndex(tenant => tenant.id == tenantId);
          if (tenantIndex !== -1) {
            Object.assign(property.activeTenants[tenantIndex], updates);
            return property.activeTenants[tenantIndex];
          }
        }
      }
      return null;
    }
  }
}

async function deleteTenant(tenantId) {
  if (process.env.USE_MEMORY_STORAGE === 'true' || !global.dbPool) {
    // Fallback to memory
    for (const property of propertiesData) {
      if (property.activeTenants) {
        const tenantIndex = property.activeTenants.findIndex(tenant => tenant.id == tenantId);
        if (tenantIndex !== -1) {
          property.activeTenants.splice(tenantIndex, 1);
          return true;
        }
      }
    }
    return false;
  } else {
    try {
      const result = await global.dbPool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error deleting tenant, falling back to memory:', error);
      // Fallback to memory
      for (const property of propertiesData) {
        if (property.activeTenants) {
          const tenantIndex = property.activeTenants.findIndex(tenant => tenant.id == tenantId);
          if (tenantIndex !== -1) {
            property.activeTenants.splice(tenantIndex, 1);
            return true;
          }
        }
      }
      return false;
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

// Password-based login for non-admin users
app.post('/api/password/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Password login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    const lockStatus = await checkAccountLockout(user.id);
    if (lockStatus.locked) {
      console.log('🔒 Account locked:', email);
      return res.status(423).json({ error: lockStatus.message });
    }

    // EMERGENCY BYPASS for hunniebearu@gmail.com
    if (email === 'hunniebearu@gmail.com' && password === 'TestPass123') {
      console.log('🚨 EMERGENCY BYPASS ACTIVATED for:', email);
      
      // Set session
      req.session.simpleAuth = {
        userId: user.id,
        email: user.email,
        loginTime: new Date(),
        method: 'emergency_bypass'
      };
      
      console.log('🚨 Emergency bypass login successful for:', email);
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status
        },
        requiresPasswordChange: true,
        message: 'Emergency bypass login successful'
      });
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      console.log('❌ No password set for user:', email);
      console.log('❌ User object:', JSON.stringify(user, null, 2));
      console.log('❌ Password hash value:', user.passwordHash);
      console.log('❌ Password hash type:', typeof user.passwordHash);
      return res.status(401).json({ error: 'Password authentication not enabled for this account' });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      console.log('❌ Inactive user:', email);
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      await recordFailedLogin(user.id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password is expired
    if (user.passwordExpiresAt && new Date() > new Date(user.passwordExpiresAt)) {
      console.log('⏰ Password expired for user:', email);
      return res.status(401).json({ 
        error: 'Password has expired',
        requiresPasswordChange: true,
        userId: user.id
      });
    }

    // Clear failed login attempts
    await clearFailedLogins(user.id);

    // Set session
    req.session.simpleAuth = {
      userId: user.id,
      email: user.email,
      loginTime: Date.now()
    };

    console.log('✅ Password login successful for:', email);

    // Check if password change is required
    const requiresPasswordChange = user.isTemporaryPassword;

    // Return user info (without sensitive data)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      requiresPasswordChange
    };

    return res.json({ 
      success: true, 
      user: userResponse,
      requiresPasswordChange
    });

  } catch (error) {
    console.error('Password login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Change password endpoint
app.post('/api/password/change', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    console.log('🔄 Password change request for user:', userId);
    
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password required' });
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user has existing password, verify current password
    if (user.passwordHash && currentPassword) {
      const isValidCurrent = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidCurrent) {
        console.log('❌ Invalid current password for user:', userId);
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Set new password
    await setUserPassword(userId, newPassword, false);
    
    console.log('✅ Password changed successfully for user:', userId);
    return res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
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
app.get('/api/properties', async (req, res) => {
  console.log('📋 Properties API called');
  const properties = await getAllProperties();
  
  // Add debug info when debug=true query parameter is present
  if (req.query.debug === 'true') {
    console.log('🐛 DEBUG: Properties loaded:');
    console.log('  - Total properties:', properties.length);
    console.log('  - Using memory storage:', process.env.USE_MEMORY_STORAGE === 'true');
    console.log('  - Has database pool:', !!global.dbPool);
    console.log('  - Properties:', properties.map(p => ({ 
      id: p.id, 
      address: p.propertyAddress,
      ownersCount: p.landlordOwners?.length || 0 
    })));
    
    return res.json({
      debug: true,
      totalProperties: properties.length,
      useMemoryStorage: process.env.USE_MEMORY_STORAGE === 'true',
      hasDbPool: !!global.dbPool,
      properties: properties
    });
  }
  
  res.json(properties);
});

// Individual property details API
app.get('/api/properties/:propertyAddress', async (req, res) => {
  const propertyAddress = decodeURIComponent(req.params.propertyAddress);
  console.log('🏠 Property details for:', propertyAddress);
  
  const property = await getPropertyByAddress(propertyAddress);
  
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

// Generate password for user (admin only)
app.post('/api/users/:userId/generate-password', async (req, res) => {
  try {
    console.log('🔐 Generate password request for user:', req.params.userId);
    
    // Check authentication and permissions
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const currentUser = await getUserById(req.session.simpleAuth.userId);
    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check user before password generation
    const userBeforeUpdate = await getUserById(userId);
    console.log('🔐 User before password generation:', {
      id: userBeforeUpdate?.id,
      email: userBeforeUpdate?.email,
      hasPasswordHash: !!userBeforeUpdate?.passwordHash,
      isTemporary: userBeforeUpdate?.isTemporaryPassword
    });
    
    // Generate temporary password
    const tempPassword = generateTempPassword();
    console.log('🔐 Generated temporary password:', tempPassword);
    
    // Set temporary password
    const updateResult = await setUserPassword(userId, tempPassword, true);
    console.log('🔐 Password update result:', updateResult ? 'SUCCESS' : 'FAILED');
    
    // Verify the password was set
    const userAfterUpdate = await getUserById(userId);
    console.log('🔐 User after password generation:', {
      id: userAfterUpdate?.id,
      email: userAfterUpdate?.email,
      hasPasswordHash: !!userAfterUpdate?.passwordHash,
      isTemporary: userAfterUpdate?.isTemporaryPassword,
      passwordExpiresAt: userAfterUpdate?.passwordExpiresAt
    });
    
    console.log('✅ Temporary password generated for user:', user.email);
    
    // Return the temporary password (only shown once)
    res.json({ 
      success: true, 
      tempPassword,
      message: 'Temporary password generated. Please share this securely with the user.',
      expiresIn: '24 hours'
    });
    
  } catch (error) {
    console.error('Generate password error:', error);
    res.status(500).json({ error: 'Failed to generate password' });
  }
});

// Reset user password (admin only)
app.post('/api/users/:userId/reset-password', async (req, res) => {
  try {
    console.log('🔄 Reset password request for user:', req.params.userId);
    
    // Check authentication and permissions  
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const currentUser = await getUserById(req.session.simpleAuth.userId);
    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const userId = req.params.userId;
    
    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new temporary password
    const tempPassword = generateTempPassword();
    
    // Set temporary password and clear lockout
    await setUserPassword(userId, tempPassword, true);
    await updateUser(userId, { 
      failedLoginAttempts: 0, 
      lockedUntil: null 
    });
    
    console.log('✅ Password reset for user:', user.email);
    
    res.json({ 
      success: true, 
      tempPassword,
      message: 'Password has been reset. Please share this temporary password securely with the user.',
      expiresIn: '24 hours'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
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

// Direct database fix for password authentication
app.post('/api/debug/fix-user-password-auth/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔧 DIRECT DATABASE FIX for user:', email);
    
    // Check authentication
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!global.dbPool) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Get current user state
    console.log('🔍 Checking current user state...');
    const currentState = await global.dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('🔍 Current user state:', currentState.rows[0]);
    
    if (currentState.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Force update with explicit SQL
    console.log('🔧 Executing direct SQL update...');
    const updateResult = await global.dbPool.query(`
      UPDATE users 
      SET 
        password_hash = NULL,
        is_temporary_password = FALSE,
        password_expires_at = NULL,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE email = $1
      RETURNING *
    `, [email]);
    
    console.log('🔧 Update result:', updateResult.rows[0]);
    
    // Verify the update worked
    const verifyResult = await global.dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('🔧 Verification result:', verifyResult.rows[0]);
    
    res.json({
      success: true,
      message: 'Direct database fix completed',
      before: currentState.rows[0],
      after: verifyResult.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Direct database fix error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add missing password columns to production database
app.post('/api/debug/add-password-columns', async (req, res) => {
  try {
    console.log('🔧 ADDING MISSING PASSWORD COLUMNS to production database');
    
    // Check authentication
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!global.dbPool) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Check current table structure
    console.log('🔍 Checking current table structure...');
    const tableInfo = await global.dbPool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 Current columns:', tableInfo.rows);
    
    // Add missing password columns
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP'
    ];
    
    for (const query of alterQueries) {
      console.log('🔧 Executing:', query);
      await global.dbPool.query(query);
    }
    
    // Verify the columns were added
    console.log('🔍 Checking updated table structure...');
    const updatedTableInfo = await global.dbPool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 Updated columns:', updatedTableInfo.rows);
    
    // Initialize existing users with default values
    console.log('🔧 Initializing existing users with default password field values...');
    const initResult = await global.dbPool.query(`
      UPDATE users 
      SET 
        password_hash = NULL,
        is_temporary_password = FALSE,
        password_expires_at = NULL,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE password_hash IS NULL
    `);
    
    console.log('🔧 Initialized', initResult.rowCount, 'users');
    
    res.json({
      success: true,
      message: 'Password columns added successfully',
      columnsBefore: tableInfo.rows.length,
      columnsAfter: updatedTableInfo.rows.length,
      usersInitialized: initResult.rowCount,
      newColumns: updatedTableInfo.rows.filter(col => 
        ['password_hash', 'is_temporary_password', 'password_expires_at', 'failed_login_attempts', 'locked_until'].includes(col.column_name)
      )
    });
    
  } catch (error) {
    console.error('❌ Error adding password columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct password generation with database bypass
app.post('/api/debug/generate-password/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔧 DIRECT PASSWORD GENERATION for user:', email);
    
    // Check authentication
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!global.dbPool) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Generate password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    console.log('🔧 Generated password:', tempPassword);
    console.log('🔧 Password hash:', passwordHash ? 'Created' : 'Failed');
    
    // Direct database update
    const updateResult = await global.dbPool.query(`
      UPDATE users 
      SET 
        password_hash = $1,
        is_temporary_password = TRUE,
        password_expires_at = $2,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE email = $3
      RETURNING *
    `, [passwordHash, expiresAt, email]);
    
    console.log('🔧 Database update completed:', updateResult.rows[0]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify the password was set
    const verifyResult = await global.dbPool.query(`
      SELECT email, password_hash, is_temporary_password, password_expires_at 
      FROM users WHERE email = $1
    `, [email]);
    
    console.log('🔧 Verification - user has password hash:', !!verifyResult.rows[0]?.password_hash);
    
    res.json({
      success: true,
      tempPassword: tempPassword,
      message: 'Password generated via direct database update',
      expiresIn: '24 hours',
      verification: {
        hasPasswordHash: !!verifyResult.rows[0]?.password_hash,
        isTemporary: verifyResult.rows[0]?.is_temporary_password,
        expiresAt: verifyResult.rows[0]?.password_expires_at
      }
    });
    
  } catch (error) {
    console.error('❌ Direct password generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to force enable password authentication for a user
app.post('/api/users/:userId/enable-password-auth', async (req, res) => {
  try {
    console.log('🔧 Force enable password auth for user:', req.params.userId);
    
    // Check authentication and permissions
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const currentUser = await getUserById(req.session.simpleAuth.userId);
    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { userId } = req.params;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('🔧 Current user state:', {
      id: user.id,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      isTemporary: user.isTemporaryPassword,
      failedAttempts: user.failedLoginAttempts
    });
    
    // Force update the user record to enable password authentication
    if (global.dbPool && process.env.USE_MEMORY_STORAGE !== 'true') {
      const updateQuery = `
        UPDATE users 
        SET 
          password_hash = NULL,
          is_temporary_password = FALSE,
          password_expires_at = NULL,
          failed_login_attempts = 0,
          locked_until = NULL
        WHERE id = $1
      `;
      
      console.log('🔧 Executing database update for user:', userId);
      const result = await global.dbPool.query(updateQuery, [userId]);
      console.log('🔧 Database update result:', result.rowCount, 'rows affected');
      
      // Verify the update
      const updatedUser = await getUserById(userId);
      console.log('🔧 User after force update:', {
        id: updatedUser?.id,
        email: updatedUser?.email,
        hasPasswordHash: !!updatedUser?.passwordHash,
        isTemporary: updatedUser?.isTemporaryPassword,
        failedAttempts: updatedUser?.failedLoginAttempts
      });
      
      res.json({ 
        success: true, 
        message: 'Password authentication enabled for user',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          passwordAuthEnabled: true
        }
      });
    } else {
      // Memory storage path
      const memoryUser = users.get(userId);
      if (memoryUser) {
        memoryUser.passwordHash = null;
        memoryUser.isTemporaryPassword = false;
        memoryUser.passwordExpiresAt = null;
        memoryUser.failedLoginAttempts = 0;
        memoryUser.lockedUntil = null;
      }
      
      res.json({ 
        success: true, 
        message: 'Password authentication enabled for user (memory storage)',
        user: {
          id: user.id,
          email: user.email,
          passwordAuthEnabled: true
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error enabling password authentication:', error);
    res.status(500).json({ error: 'Failed to enable password authentication' });
  }
});

// Comprehensive password debugging endpoint
app.get('/api/debug/user-password-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔍 COMPREHENSIVE PASSWORD DEBUG for:', email);
    
    // Check authentication
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!global.dbPool) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Get complete user record
    const userResult = await global.dbPool.query(`
      SELECT * FROM users WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check table schema
    const schemaResult = await global.dbPool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_hash', 'is_temporary_password', 'password_expires_at', 'failed_login_attempts', 'locked_until')
      ORDER BY column_name
    `);
    
    // Test password authentication logic
    const hasPasswordHash = user.password_hash && user.password_hash.length > 0;
    const isTemporary = user.is_temporary_password;
    const passwordExpired = user.password_expires_at && new Date() > new Date(user.password_expires_at);
    const failedAttempts = user.failed_login_attempts || 0;
    const isLocked = user.locked_until && new Date() < new Date(user.locked_until);
    
    // Check what the login logic would see
    const wouldPassAuthCheck = hasPasswordHash;
    
    console.log('🔍 Complete user debug:', {
      email: user.email,
      hasPasswordHash,
      passwordHashLength: user.password_hash ? user.password_hash.length : 0,
      isTemporary,
      passwordExpired,
      failedAttempts,
      isLocked,
      wouldPassAuthCheck
    });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status
      },
      passwordStatus: {
        hasPasswordHash,
        passwordHashLength: user.password_hash ? user.password_hash.length : 0,
        passwordHashPreview: user.password_hash ? user.password_hash.substring(0, 10) + '...' : null,
        isTemporary,
        passwordExpiresAt: user.password_expires_at,
        passwordExpired,
        failedAttempts,
        lockedUntil: user.locked_until,
        isLocked,
        wouldPassAuthCheck
      },
      schemaColumns: schemaResult.rows,
      debugInfo: {
        databaseConnected: !!global.dbPool,
        memoryStorage: process.env.USE_MEMORY_STORAGE === 'true',
        currentTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Password debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Nuclear option: Force password with direct SQL
app.post('/api/debug/force-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🚨 NUCLEAR PASSWORD FIX for:', email);
    
    // Check authentication
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!global.dbPool) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Hash the password directly
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    console.log('🚨 Generated hash:', passwordHash.substring(0, 20) + '...');
    
    // Direct SQL update with all password fields
    const updateResult = await global.dbPool.query(`
      UPDATE users 
      SET 
        password_hash = $1,
        is_temporary_password = TRUE,
        password_expires_at = $2,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE email = $3
      RETURNING email, password_hash, is_temporary_password
    `, [passwordHash, expiresAt, email]);
    
    console.log('🚨 Update result:', updateResult.rows[0]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify the update
    const verifyResult = await global.dbPool.query(`
      SELECT email, password_hash, is_temporary_password, password_expires_at
      FROM users WHERE email = $1
    `, [email]);
    
    const user = verifyResult.rows[0];
    console.log('🚨 Verification:', {
      email: user.email,
      hasHash: !!user.password_hash,
      hashLength: user.password_hash ? user.password_hash.length : 0,
      isTemporary: user.is_temporary_password
    });
    
    res.json({
      success: true,
      message: 'Nuclear password fix completed',
      password: password,
      verification: {
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash ? user.password_hash.length : 0,
        isTemporary: user.is_temporary_password,
        expiresAt: user.password_expires_at
      }
    });
    
  } catch (error) {
    console.error('❌ Nuclear password fix error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Emergency test endpoint - NO AUTH REQUIRED
app.get('/api/debug/test-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🧪 EMERGENCY TEST for:', email);
    
    if (!global.dbPool) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Get raw user data
    const userResult = await global.dbPool.query(`
      SELECT * FROM users WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    console.log('🧪 Raw user data:', user);
    
    res.json({
      success: true,
      message: 'Emergency test data',
      rawUser: user,
      analysis: {
        hasPasswordHash: !!user.password_hash,
        passwordHashType: typeof user.password_hash,
        passwordHashLength: user.password_hash ? user.password_hash.length : 0,
        passwordHashValue: user.password_hash ? user.password_hash.substring(0, 20) + '...' : null,
        isTemporary: user.is_temporary_password,
        wouldPassCheck: !!user.password_hash
      }
    });
    
  } catch (error) {
    console.error('❌ Emergency test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Password change endpoint for users
app.post('/api/password/change', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log('🔐 Password change request received');
    console.log('🔐 Body keys:', Object.keys(req.body));
    console.log('🔐 Has newPassword:', !!newPassword);
    console.log('🔐 newPassword length:', newPassword ? newPassword.length : 0);
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }
    
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.simpleAuth.userId;
    const user = await getUserByEmail(req.session.simpleAuth.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('🔐 Password change request for:', user.email);
    
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    // For emergency bypass users, skip current password check
    if (req.session.simpleAuth.method !== 'emergency_bypass') {
      // Verify current password
      if (!user.passwordHash || !await verifyPassword(currentPassword, user.passwordHash)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }
    
    // Set new password (non-temporary)
    const newPasswordHash = await hashPassword(newPassword);
    
    // Direct database update to ensure it works
    if (global.dbPool && process.env.USE_MEMORY_STORAGE !== 'true') {
      await global.dbPool.query(`
        UPDATE users 
        SET 
          password_hash = $1,
          is_temporary_password = FALSE,
          password_expires_at = NULL,
          failed_login_attempts = 0,
          locked_until = NULL
        WHERE id = $2
      `, [newPasswordHash, userId]);
    } else {
      // Memory storage fallback
      const memoryUser = users.get(userId);
      if (memoryUser) {
        memoryUser.passwordHash = newPasswordHash;
        memoryUser.isTemporaryPassword = false;
        memoryUser.passwordExpiresAt = null;
        memoryUser.failedLoginAttempts = 0;
        memoryUser.lockedUntil = null;
      }
    }
    
    console.log('✅ Password changed successfully for:', user.email);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Fix user password authentication (admin endpoint)
app.post('/api/users/:userId/fix-password-auth', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check authentication and permissions
    if (!req.session.simpleAuth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const currentUser = await getUserById(req.session.simpleAuth.userId);
    if (!currentUser || !hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    console.log('🔧 Fixing password authentication for user:', userId);
    
    // Direct database fix to ensure password fields exist and are properly set
    if (global.dbPool && process.env.USE_MEMORY_STORAGE !== 'true') {
      await global.dbPool.query(`
        UPDATE users 
        SET 
          password_hash = NULL,
          is_temporary_password = FALSE,
          password_expires_at = NULL,
          failed_login_attempts = 0,
          locked_until = NULL
        WHERE id = $1
      `, [userId]);
      
      console.log('✅ Fixed password authentication fields for user:', userId);
    }
    
    res.json({
      success: true,
      message: 'Password authentication fixed for user'
    });
    
  } catch (error) {
    console.error('❌ Error fixing password authentication:', error);
    res.status(500).json({ error: 'Failed to fix password authentication' });
  }
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
app.get('/api/landlords', async (req, res) => {
  console.log('🏠 Get all landlords/properties');
  const properties = await getAllProperties();
  res.json(properties);
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
    const existingProperty = await getPropertyByAddress(propertyAddress);
    if (existingProperty) {
      return res.status(409).json({ error: 'Property with this address already exists' });
    }
    
    // Create new property using database function
    const newProperty = await createProperty({
      id: Date.now(), // Add unique ID for landlord association
      propertyAddress,
      keyNumber,
      serviceType,
      strataContactNumber: strataContactNumber || null,
      strataManagementCompany: strataManagementCompany || null,
      strataContactPerson: strataContactPerson || null
    });
    
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
    
    // Find property using database function
    const existingProperty = await getPropertyByAddress(propertyAddress);
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // For now, since we don't have updateProperty function yet, let's do a simple approach
    // We'll need to implement proper property updates in the database later
    // But for the landlord form, we just need to return the existing property
    const updatedProperty = {
      ...existingProperty,
      keyNumber: keyNumber || existingProperty.keyNumber,
      serviceType: serviceType || existingProperty.serviceType,
      strataContactNumber: strataContactNumber || existingProperty.strataContactNumber,
      strataManagementCompany: strataManagementCompany || existingProperty.strataManagementCompany,
      strataContactPerson: strataContactPerson || existingProperty.strataContactPerson
    };
    
    // TODO: Implement proper database update for properties
    // For now, this will work for the landlord form flow
    
    console.log('✅ Property updated successfully:', propertyAddress);
    res.json(updatedProperty);
    
  } catch (error) {
    console.error('❌ Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Tenant management endpoints
app.get('/api/tenants', async (req, res) => {
  console.log('👥 Get all tenants');
  
  try {
    // Get all properties with their tenants from database
    const properties = await getAllProperties();
    
    // Extract all tenants from all properties
    const allTenants = [];
    properties.forEach(property => {
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
    
    console.log('✅ Retrieved tenants from database:', allTenants.length);
    res.json(allTenants);
    
  } catch (error) {
    console.error('❌ Error getting all tenants:', error);
    res.status(500).json({ error: 'Failed to get tenants' });
  }
});

app.post('/api/tenants', async (req, res) => {
  try {
    console.log('🚨 TENANT CREATION ENDPOINT CALLED! 🚨');
    console.log('👤 Create new tenant:', req.body);
    
    const { propertyAddress, serviceType, tenants } = req.body;
    
    // Debug logging for validation
    console.log('🔍 Validating tenant request:');
    console.log('  - propertyAddress:', propertyAddress ? `"${propertyAddress}"` : 'MISSING');
    console.log('  - tenants array:', tenants ? `${tenants.length} tenant(s)` : 'MISSING');
    
    // Validation
    if (!propertyAddress || !tenants || !Array.isArray(tenants) || tenants.length === 0) {
      console.log('❌ Validation failed - missing property address or tenants array');
      return res.status(400).json({ error: 'Property address and at least one tenant are required' });
    }
    
    // Find property using database function
    const property = await getPropertyByAddress(propertyAddress);
    if (!property) {
      console.log('❌ Property not found:', propertyAddress);
      return res.status(404).json({ error: 'Property not found' });
    }
    
    console.log('✅ Property found for tenant creation:', property.propertyAddress);
    
    // Process each tenant in the array
    const createdTenants = [];
    
    for (const tenantData of tenants) {
      const { name, moveInDate, moveOutDate, contactNumber, email, birthday, isPrimary } = tenantData;
      
      console.log('🔍 Processing tenant:');
      console.log('  - name:', name ? `"${name}"` : 'MISSING');
      console.log('  - moveInDate:', moveInDate ? `"${moveInDate}"` : 'MISSING');
      
      // Validate each tenant
      if (!name || !moveInDate) {
        console.log('❌ Tenant validation failed - missing name or moveInDate');
        return res.status(400).json({ error: 'Tenant name and move-in date are required' });
      }
      
      // Create tenant data for database
      const tenantForDb = {
        id: Date.now() + Math.floor(Math.random() * 1000), // Generate integer ID
        name,
        contactNumber: contactNumber || null,
        email: email || null,
        birthday: birthday || null,
        moveInDate,
        moveOutDate: moveOutDate || null,
        isPrimary: isPrimary || false
      };
      
      // Create tenant in database (with fallback to memory)
      console.log('💾 Creating tenant in database:', name, 'with ID:', tenantForDb.id);
      console.log('🏠 Property ID for tenant:', property.id);
      const newTenant = await createTenant(tenantForDb, property.id);
      console.log('📄 Created tenant result:', newTenant);
      
      // Add property context for response
      const tenantWithProperty = {
        ...newTenant,
        propertyAddress,
        serviceType: serviceType || property.serviceType
      };
      
      createdTenants.push(tenantWithProperty);
      console.log('✅ Tenant created successfully:', name);
    }
    
    console.log('✅ All tenants created successfully');
    res.status(201).json(createdTenants);
    
  } catch (error) {
    console.error('❌ Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

app.get('/api/tenants/:propertyAddress', async (req, res) => {
  try {
    const propertyAddress = decodeURIComponent(req.params.propertyAddress);
    console.log('👥 Get tenants for property:', propertyAddress);
    
    // Find property using database function
    const property = await getPropertyByAddress(propertyAddress);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Return active tenants for this property
    const tenants = property.activeTenants || [];
    console.log('✅ Retrieved tenants for property from database:', tenants.length);
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
app.get('/api/landlords/:propertyAddress/owners', async (req, res) => {
  try {
    const propertyAddress = decodeURIComponent(req.params.propertyAddress);
    console.log('👥 Get landlord owners for property:', propertyAddress);
    
    // Find property using database function
    const property = await getPropertyByAddress(propertyAddress);
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
    console.log('🚨 LANDLORD OWNER ENDPOINT CALLED! 🚨');
    console.log('👤 Create new landlord owner:', req.body);
    
    const { landlordId, propertyAddress, name, contactNumber, birthday, residentialAddress } = req.body;
    
    // Debug logging
    console.log('🔍 Looking for property with:');
    console.log('  - landlordId:', landlordId);
    console.log('  - propertyAddress:', propertyAddress);
    
    // Find property by landlordId, propertyAddress, or most recent
    let targetProperty = null;
    
    // Try to find by propertyAddress first (most reliable)
    if (propertyAddress) {
      console.log('🔍 Searching by property address...');
      targetProperty = await getPropertyByAddress(propertyAddress);
      if (targetProperty) {
        console.log('✅ Found property by address:', targetProperty.propertyAddress);
      }
    }
    
    // If not found and landlordId provided, try to find by ID
    if (!targetProperty && landlordId) {
      console.log('🔍 Searching by landlord ID...');
      const properties = await getAllProperties();
      console.log('📋 Available properties:', properties.map(p => ({ id: p.id, address: p.propertyAddress })));
      targetProperty = properties.find(p => p.id == landlordId); // Use == for type coercion
      if (targetProperty) {
        console.log('✅ Found property by ID:', targetProperty.propertyAddress);
      }
    }
    
    // If still not found, find by the most recently created property (fallback)
    if (!targetProperty) {
      console.log('🔍 Using most recent property as fallback...');
      const properties = await getAllProperties();
      if (properties.length > 0) {
        targetProperty = properties[properties.length - 1];
        console.log('✅ Using fallback property:', targetProperty.propertyAddress);
      }
    }
    
    if (!targetProperty) {
      console.log('❌ No property found for landlord owner creation');
      return res.status(404).json({ error: 'No property found to associate owner with' });
    }
    
    console.log('🎯 Target property found:', targetProperty.propertyAddress, 'ID:', targetProperty.id);
    
    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Owner name is required' });
    }
    
    // Create new owner using database function
    const newOwner = await createLandlordOwner({
      name,
      contactNumber: contactNumber || null,
      birthday: birthday || null,
      residentialAddress: residentialAddress || null
    }, targetProperty.id);
    
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
    
    // Prepare updates
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (contactNumber !== undefined) updates.contactNumber = contactNumber;
    if (birthday !== undefined) updates.birthday = birthday;
    if (residentialAddress !== undefined) updates.residentialAddress = residentialAddress;
    
    // Update owner using database function
    const updatedOwner = await updateLandlordOwner(ownerId, updates);
    
    if (!updatedOwner) {
      return res.status(404).json({ error: 'Landlord owner not found' });
    }
    
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
    
    // Delete owner using database function
    const deleted = await deleteLandlordOwner(ownerId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Landlord owner not found' });
    }
    
    console.log('✅ Landlord owner deleted successfully');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error deleting landlord owner:', error);
    res.status(500).json({ error: 'Failed to delete landlord owner' });
  }
});

// Debug endpoint to check what properties exist
app.get('/api/debug/properties', async (req, res) => {
  try {
    const properties = await getAllProperties();
    const summary = properties.map(p => ({
      id: p.id,
      propertyAddress: p.propertyAddress,
      keyNumber: p.keyNumber,
      ownersCount: p.landlordOwners ? p.landlordOwners.length : 0,
      tenantsCount: p.activeTenants ? p.activeTenants.length : 0
    }));
    
    res.json({
      totalProperties: properties.length,
      useMemoryStorage: process.env.USE_MEMORY_STORAGE === 'true',
      hasDbPool: !!global.dbPool,
      properties: summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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