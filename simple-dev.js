// Ultra-simple development server
import express from 'express';

const app = express();
app.use(express.json());

// Simple in-memory storage
const storage = {
  landlords: [],
  landlordOwners: [],
  tenants: [],
  rentalRateIncreases: [],
  nextId: 1
};

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize test data
app.get('/api/init-db', (req, res) => {
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
  
  // Create test landlord owner
  const testOwner = {
    id: storage.nextId++,
    landlordId: testProperty.id,
    name: "John Doe",
    contactNumber: "604-555-0123",
    birthday: "1980-07-25",
    residentialAddress: "123 Main St, Vancouver, BC"
  };
  storage.landlordOwners.push(testOwner);
  
  // Create test tenant
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
    message: "Database initialized successfully",
    testProperty,
    testOwner,
    testTenant,
    testRentalIncrease
  });
});

// Properties endpoint
app.get('/api/properties', (req, res) => {
  const properties = storage.landlords.map(landlord => {
    const owners = storage.landlordOwners.filter(o => o.landlordId === landlord.id);
    const tenant = storage.tenants.find(t => t.propertyAddress === landlord.propertyAddress);
    const rentalIncrease = storage.rentalRateIncreases.find(r => r.propertyAddress === landlord.propertyAddress);
    
    return {
      propertyAddress: landlord.propertyAddress,
      keyNumber: landlord.keyNumber,
      serviceType: landlord.serviceType,
      landlordOwners: owners.map(owner => ({
        name: owner.name,
        contactNumber: owner.contactNumber,
        birthday: owner.birthday ? new Date(owner.birthday) : undefined,
        residentialAddress: owner.residentialAddress
      })),
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        contactNumber: tenant.contactNumber,
        email: tenant.email,
        birthday: tenant.birthday ? new Date(tenant.birthday) : undefined,
        moveInDate: new Date(tenant.moveInDate)
      } : undefined,
      rentalInfo: rentalIncrease ? {
        latestRentalRate: rentalIncrease.latestRentalRate,
        latestRateIncreaseDate: new Date(rentalIncrease.latestRateIncreaseDate),
        nextAllowableRentalIncreaseDate: new Date(rentalIncrease.nextAllowableRentalIncreaseDate),
        nextAllowableRentalRate: rentalIncrease.nextAllowableRentalRate,
        reminderDate: new Date(rentalIncrease.reminderDate)
      } : undefined
    };
  });
  
  res.json(properties);
});

// Landlords endpoint
app.get('/api/landlords', (req, res) => {
  res.json(storage.landlords);
});

// Tenants endpoint
app.get('/api/tenants', (req, res) => {
  res.json(storage.tenants);
});

// Birthday reminders endpoint
app.get('/api/reminders/birthdays', (req, res) => {
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
  
  res.json(result);
});

// Rate increase reminders endpoint
app.get('/api/reminders/rental-increases', (req, res) => {
  console.log("💰 Rate increase reminders endpoint called");
  const result = [];
  
  for (const increase of storage.rentalRateIncreases) {
    const tenant = storage.tenants.find(t => t.propertyAddress === increase.propertyAddress);
    
    result.push({
      propertyAddress: increase.propertyAddress,
      serviceType: tenant?.serviceType || 'Unknown',
      latestRateIncreaseDate: increase.latestRateIncreaseDate,
      latestRentalRate: increase.latestRentalRate,
      nextAllowableRentalIncreaseDate: increase.nextAllowableRentalIncreaseDate,
      nextAllowableRentalRate: increase.nextAllowableRentalRate,
      reminderDate: increase.reminderDate
    });
  }
  
  res.json(result);
});

// Auth endpoint
app.get('/api/auth/user', (req, res) => {
  res.json({
    id: "demo-user-123",
    email: "demo@propertylinkpro.com",
    firstName: "Demo",
    lastName: "User",
    role: "admin"
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "🏠 PropertyLinkPro Development Server",
    status: "running",
    endpoints: [
      "GET /api/init-db - Initialize test data",
      "GET /api/properties - List properties",
      "GET /api/landlords - List landlords", 
      "GET /api/tenants - List tenants",
      "GET /api/reminders/birthdays - Birthday reminders",
      "GET /api/reminders/rental-increases - Rental increase reminders"
    ]
  });
});

// Start server
const PORT = 3001;
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`
🚀 PropertyLinkPro Development Server Started!
📡 Server running on: http://localhost:${PORT}
🧪 Using simple in-memory storage

📋 Quick Test Commands:
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
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});