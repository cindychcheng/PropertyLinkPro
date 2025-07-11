// Fixed Express development server with proper middleware
import express from 'express';

console.log('🚀 Starting PropertyLinkPro Development Server with Full Middleware...');

const app = express();

// Essential Express middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Simple in-memory storage
const storage = {
  landlords: [],
  landlordOwners: [],
  tenants: [],
  rentalRateIncreases: [],
  nextId: 1
};

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint called');
  res.json({
    message: "🏠 PropertyLinkPro Development Server",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: [
      "GET /health - Health check",
      "GET /api/init-db - Initialize test data",
      "GET /api/properties - List properties",
      "GET /api/landlords - List landlords", 
      "GET /api/tenants - List tenants",
      "GET /api/reminders/birthdays - Birthday reminders",
      "GET /api/reminders/rental-increases - Rental increase reminders"
    ]
  });
});

// Initialize test data
app.get('/api/init-db', (req, res) => {
  try {
    console.log("🔄 Initializing test data...");
    
    // Clear existing data
    storage.landlords = [];
    storage.landlordOwners = [];
    storage.tenants = [];
    storage.rentalRateIncreases = [];
    storage.nextId = 1;
    
    // Create test property
    const testProperty = {
      id: storage.nextId++,
      propertyAddress: "Test Property - 456 Oak St",
      keyNumber: "TEST001",
      serviceType: "Full-Service Management"
    };
    storage.landlords.push(testProperty);
    
    // Create test landlord owner with July birthday
    const testOwner = {
      id: storage.nextId++,
      landlordId: testProperty.id,
      name: "John Doe",
      contactNumber: "604-555-0123",
      birthday: "1980-07-25",
      residentialAddress: "123 Main St, Vancouver, BC"
    };
    storage.landlordOwners.push(testOwner);
    
    // Create test tenant with July birthday
    const testTenant = {
      id: storage.nextId++,
      propertyAddress: testProperty.propertyAddress,
      name: "Jane Smith",
      contactNumber: "604-555-0456",
      email: "jane.smith@example.com",
      birthday: "1985-07-09",
      moveInDate: "2023-01-15",
      serviceType: "Full-Service Management",
      isPrimary: true
    };
    storage.tenants.push(testTenant);
    
    // Create test rental rate increase
    const testRentalIncrease = {
      id: storage.nextId++,
      propertyAddress: testProperty.propertyAddress,
      latestRateIncreaseDate: "2023-01-15",
      latestRentalRate: 2500.00,
      nextAllowableRentalIncreaseDate: "2024-01-15",
      nextAllowableRentalRate: 2575.00,
      reminderDate: "2023-09-15"
    };
    storage.rentalRateIncreases.push(testRentalIncrease);
    
    console.log("✅ Test data created successfully!");
    res.json({ 
      success: true,
      message: "Database initialized successfully",
      data: {
        properties: storage.landlords.length,
        owners: storage.landlordOwners.length,
        tenants: storage.tenants.length,
        rentalIncreases: storage.rentalRateIncreases.length
      },
      testData: {
        testProperty,
        testOwner,
        testTenant,
        testRentalIncrease
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

// Birthday reminders endpoint with full debugging
app.get('/api/reminders/birthdays', (req, res) => {
  try {
    console.log("🎂 Birthday reminders endpoint called");
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const targetMonth = month || currentMonth;
    
    console.log("Current date:", currentDate.toISOString());
    console.log("Current month:", currentMonth);
    console.log("Target month:", targetMonth);
    console.log("Total landlord owners:", storage.landlordOwners.length);
    console.log("Total tenants:", storage.tenants.length);
    
    const result = [];
    
    // Check landlord owners
    for (const owner of storage.landlordOwners) {
      console.log("Checking owner:", owner.name, "birthday:", owner.birthday);
      if (owner.birthday) {
        const birthday = new Date(owner.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        console.log("Owner", owner.name, "birthday month:", birthdayMonth, "target month:", targetMonth);
        if (birthdayMonth === targetMonth) {
          console.log("✓ Adding owner to results:", owner.name);
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
      console.log("Checking tenant:", tenant.name, "birthday:", tenant.birthday);
      if (tenant.birthday) {
        const birthday = new Date(tenant.birthday);
        const birthdayMonth = birthday.getMonth() + 1;
        console.log("Tenant", tenant.name, "birthday month:", birthdayMonth, "target month:", targetMonth);
        if (birthdayMonth === targetMonth) {
          console.log("✓ Adding tenant to results:", tenant.name);
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
    
    console.log("Total birthday reminders found:", result.length);
    result.sort((a, b) => a.birthday.getDate() - b.birthday.getDate());
    
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

// Other endpoints with proper error handling
app.get('/api/properties', (req, res) => {
  try {
    const properties = storage.landlords.map(landlord => {
      const owners = storage.landlordOwners.filter(o => o.landlordId === landlord.id);
      const tenant = storage.tenants.find(t => t.propertyAddress === landlord.propertyAddress);
      const rentalIncrease = storage.rentalRateIncreases.find(r => r.propertyAddress === landlord.propertyAddress);
      
      return {
        propertyAddress: landlord.propertyAddress,
        keyNumber: landlord.keyNumber,
        serviceType: landlord.serviceType,
        landlordOwners: owners,
        tenant,
        rentalInfo: rentalIncrease
      };
    });
    
    res.json({ success: true, count: properties.length, properties });
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/landlords', (req, res) => {
  try {
    res.json({ success: true, count: storage.landlords.length, landlords: storage.landlords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/tenants', (req, res) => {
  try {
    res.json({ success: true, count: storage.tenants.length, tenants: storage.tenants });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reminders/rental-increases', (req, res) => {
  try {
    res.json({ success: true, count: storage.rentalRateIncreases.length, reminders: storage.rentalRateIncreases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Catch-all 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    method: req.method,
    url: req.originalUrl
  });
});

// Start server with proper configuration
const PORT = 8080; // Using a port we know works from our testing
const HOST = '127.0.0.1'; // Bind to localhost only (fixes macOS networking issue)

console.log(`Attempting to start server on ${HOST}:${PORT}...`);

const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  console.log(`
🚀 PropertyLinkPro Development Server Started Successfully!
📡 Server running on: http://localhost:${PORT}
🌐 Also accessible at: http://127.0.0.1:${PORT}
🔧 Bound to: ${address.address}:${address.port}
🧪 Using enhanced in-memory storage with full middleware

📋 Quick Test Commands:
curl "http://localhost:${PORT}/health"
curl "http://localhost:${PORT}/api/init-db"
curl "http://localhost:${PORT}/api/reminders/birthdays"
curl "http://localhost:${PORT}/api/properties"

🌐 Open in browser: http://localhost:${PORT}
  `);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use. Try a different port.`);
  }
  if (err.code === 'EACCES') {
    console.log(`Permission denied for port ${PORT}. Try a different port or run with elevated privileges.`);
  }
});

server.on('listening', () => {
  console.log('📡 Server listening event fired successfully');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});