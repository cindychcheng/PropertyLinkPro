// Complete PropertyLinkPro Server with Dashboard Integration
import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files
const publicPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(publicPath));

// Rate limiting store
const loginAttempts = new Map();

// Session management
const sessions = new Map();

// In-memory storage
const storage = {
  landlords: [],
  landlordOwners: [],
  tenants: [],
  rentalRateIncreases: [],
  users: [],
  nextId: 1
};

// Create admin user
const adminUser = {
  id: 'admin',
  email: 'admin@instarealty.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

storage.users.push(adminUser);

// Helper functions
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const validateSession = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session || Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
};

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ success: false, message: 'No session token' });
  }
  
  const session = validateSession(sessionId);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
  
  req.user = adminUser;
  next();
};

// Admin authentication endpoints
app.post('/api/simple/login', (req, res) => {
  const { username, password, accessToken } = req.body;
  const clientId = req.ip || 'unknown';
  
  console.log('🔐 Admin login attempt:', { username, hasPassword: !!password, hasToken: !!accessToken });
  
  // Rate limiting
  const now = Date.now();
  const attempts = loginAttempts.get(clientId) || { count: 0, lastAttempt: 0 };
  
  if (attempts.count >= 5 && now - attempts.lastAttempt < 15 * 60 * 1000) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
  
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    attempts.count = 0;
  }
  
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminAccessToken = process.env.ADMIN_ACCESS_TOKEN;
  
  let isValid = false;
  
  if (username === adminUsername && password === adminPassword) {
    isValid = true;
  } else if (accessToken && accessToken === adminAccessToken) {
    isValid = true;
  }
  
  if (isValid) {
    loginAttempts.delete(clientId);
    
    const sessionId = generateSessionId();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    sessions.set(sessionId, {
      userId: adminUser.id,
      expiresAt,
      createdAt: Date.now()
    });
    
    console.log('✅ Admin login successful');
    
    res.json({
      success: true,
      message: 'Authentication successful',
      user: adminUser,
      sessionId
    });
  } else {
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(clientId, attempts);
    
    console.log('❌ Admin login failed');
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Auth user endpoint (for React useAuth hook)
app.get('/api/auth/user', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ success: false, message: 'No session' });
  }
  
  const session = validateSession(sessionId);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }
  
  res.json(adminUser);
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  
  if (sessionId) {
    sessions.delete(sessionId);
  }
  
  res.json({ success: true, message: 'Logged out successfully' });
});

// Initialize test data endpoint
app.get('/api/init-db', (req, res) => {
  try {
    console.log("🔄 Initializing test data...");
    
    // Clear existing data
    storage.landlords = [];
    storage.landlordOwners = [];
    storage.tenants = [];
    storage.rentalRateIncreases = [];
    storage.nextId = 1;
    
    // Create test properties
    const testProperties = [
      {
        id: storage.nextId++,
        propertyAddress: "456 Oak Street, Vancouver, BC",
        keyNumber: "OAK001",
        serviceType: "Full-Service Management"
      },
      {
        id: storage.nextId++,
        propertyAddress: "789 Pine Avenue, Vancouver, BC", 
        keyNumber: "PINE002",
        serviceType: "Tenant Placement Only"
      },
      {
        id: storage.nextId++,
        propertyAddress: "123 Maple Drive, Vancouver, BC",
        keyNumber: "MAP003", 
        serviceType: "Full-Service Management"
      }
    ];
    
    storage.landlords.push(...testProperties);
    
    // Create test landlord owners with various birthdays
    const testOwners = [
      {
        id: storage.nextId++,
        landlordId: testProperties[0].id,
        name: "John Doe",
        contactNumber: "604-555-0123",
        birthday: "1980-07-25",
        residentialAddress: "123 Main St, Vancouver, BC"
      },
      {
        id: storage.nextId++,
        landlordId: testProperties[1].id,
        name: "Sarah Wilson",
        contactNumber: "604-555-0456",
        birthday: "1975-08-15",
        residentialAddress: "456 Oak St, Vancouver, BC"
      },
      {
        id: storage.nextId++,
        landlordId: testProperties[2].id,
        name: "Mike Johnson",
        contactNumber: "604-555-0789",
        birthday: "1982-07-03",
        residentialAddress: "789 Pine Ave, Vancouver, BC"
      }
    ];
    
    storage.landlordOwners.push(...testOwners);
    
    // Create test tenants with various birthdays
    const testTenants = [
      {
        id: storage.nextId++,
        propertyAddress: testProperties[0].propertyAddress,
        name: "Jane Smith",
        contactNumber: "604-555-1111",
        email: "jane.smith@email.com",
        birthday: "1985-07-09",
        moveInDate: "2023-01-15",
        serviceType: "Full-Service Management",
        isPrimary: true
      },
      {
        id: storage.nextId++,
        propertyAddress: testProperties[1].propertyAddress,
        name: "Bob Wilson",
        contactNumber: "604-555-2222",
        email: "bob.wilson@email.com",
        birthday: "1990-08-20",
        moveInDate: "2023-03-01",
        serviceType: "Tenant Placement Only",
        isPrimary: true
      },
      {
        id: storage.nextId++,
        propertyAddress: testProperties[2].propertyAddress,
        name: "Alice Brown",
        contactNumber: "604-555-3333",
        email: "alice.brown@email.com",
        birthday: "1988-07-12",
        moveInDate: "2023-05-01",
        serviceType: "Full-Service Management",
        isPrimary: true
      }
    ];
    
    storage.tenants.push(...testTenants);
    
    // Create test rental rate increases
    const testRentalIncreases = [
      {
        id: storage.nextId++,
        propertyAddress: testProperties[0].propertyAddress,
        latestRateIncreaseDate: "2023-01-15",
        latestRentalRate: 2500.00,
        nextAllowableRentalIncreaseDate: "2024-01-15",
        nextAllowableRentalRate: 2575.00,
        reminderDate: "2023-09-15"
      },
      {
        id: storage.nextId++,
        propertyAddress: testProperties[1].propertyAddress,
        latestRateIncreaseDate: "2023-03-01",
        latestRentalRate: 2200.00,
        nextAllowableRentalIncreaseDate: "2024-03-01",
        nextAllowableRentalRate: 2266.00,
        reminderDate: "2023-11-01"
      },
      {
        id: storage.nextId++,
        propertyAddress: testProperties[2].propertyAddress,
        latestRateIncreaseDate: "2023-05-01",
        latestRentalRate: 2800.00,
        nextAllowableRentalIncreaseDate: "2024-05-01",
        nextAllowableRentalRate: 2884.00,
        reminderDate: "2024-01-01"
      }
    ];
    
    storage.rentalRateIncreases.push(...testRentalIncreases);
    
    console.log("✅ Test data created successfully!");
    res.json({ 
      success: true,
      message: "Database initialized successfully",
      data: {
        properties: storage.landlords.length,
        owners: storage.landlordOwners.length,
        tenants: storage.tenants.length,
        rentalIncreases: storage.rentalRateIncreases.length
      }
    });
  } catch (error) {
    console.error('Init-db error:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to initialize database",
      error: error.message
    });
  }
});

// Properties API endpoints
app.get('/api/properties', (req, res) => {
  try {
    const properties = storage.landlords.map(landlord => {
      const owners = storage.landlordOwners.filter(o => o.landlordId === landlord.id);
      const tenant = storage.tenants.find(t => t.propertyAddress === landlord.propertyAddress);
      const rentalIncrease = storage.rentalRateIncreases.find(r => r.propertyAddress === landlord.propertyAddress);
      
      return {
        id: landlord.id,
        propertyAddress: landlord.propertyAddress,
        keyNumber: landlord.keyNumber,
        serviceType: landlord.serviceType,
        landlordOwners: owners,
        tenant,
        rentalInfo: rentalIncrease
      };
    });
    
    res.json({ success: true, properties });
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Birthday reminders API
app.get('/api/reminders/birthdays', (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const targetMonth = month || currentMonth;
    
    console.log("🎂 Birthday reminders for month:", targetMonth);
    
    const result = [];
    
    // Check landlord owners
    for (const owner of storage.landlordOwners) {
      if (owner.birthday) {
        const birthday = new Date(owner.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        if (birthdayMonth === targetMonth) {
          result.push({
            name: owner.name,
            role: 'Landlord',
            contactNumber: owner.contactNumber || 'N/A',
            birthday: new Date(owner.birthday),
            propertyAddress: owner.residentialAddress || 'N/A'
          });
        }
      }
    }
    
    // Check tenants
    for (const tenant of storage.tenants) {
      if (tenant.birthday) {
        const birthday = new Date(tenant.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        if (birthdayMonth === targetMonth) {
          result.push({
            name: tenant.name,
            role: 'Tenant',
            contactNumber: tenant.contactNumber || 'N/A',
            birthday: new Date(tenant.birthday),
            propertyAddress: tenant.propertyAddress
          });
        }
      }
    }
    
    result.sort((a, b) => a.birthday.getDate() - b.birthday.getDate());
    
    console.log("Found birthday reminders:", result.length);
    
    res.json({
      success: true,
      count: result.length,
      currentMonth,
      targetMonth,
      reminders: result
    });
  } catch (error) {
    console.error('Birthday reminders error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch birthday reminders",
      error: error.message
    });
  }
});

// Rate increase reminders API
app.get('/api/reminders/rental-increases', (req, res) => {
  try {
    res.json({ 
      success: true, 
      count: storage.rentalRateIncreases.length, 
      reminders: storage.rentalRateIncreases 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Other API endpoints
app.get('/api/landlords', (req, res) => {
  res.json({ success: true, landlords: storage.landlords });
});

app.get('/api/tenants', (req, res) => {
  res.json({ success: true, tenants: storage.tenants });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    dashboard: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for React Router (SPA)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false,
      message: 'API endpoint not found' 
    });
  }
  
  // Serve React app for all non-API routes
  res.sendFile(path.join(publicPath, 'index.html'));
});

const server = app.listen(8080, '127.0.0.1', () => {
  console.log('🚀 PropertyLinkPro Dashboard Server running on http://localhost:8080');
  console.log('🔐 Admin Login: Use /admin to access the login page');
  console.log('🏠 Dashboard: Full property management dashboard available after login');
  console.log('🔑 Admin Credentials: Check .env file for secure credentials');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

export default app;