// Express server with auto-port assignment
import express from 'express';

console.log('🚀 Starting Express server with auto-port assignment...');

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

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "🏠 PropertyLinkPro Development Server",
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
  
  console.log("✅ Test data created successfully!");
  res.json({ 
    success: true,
    message: "Database initialized successfully",
    data: {
      properties: storage.landlords.length,
      owners: storage.landlordOwners.length,
      tenants: storage.tenants.length
    }
  });
});

// Birthday reminders endpoint
app.get('/api/reminders/birthdays', (req, res) => {
  console.log("🎂 Birthday reminders endpoint called");
  const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const targetMonth = month || currentMonth;
  
  console.log("Target month:", targetMonth);
  console.log("Total landlord owners:", storage.landlordOwners.length);
  console.log("Total tenants:", storage.tenants.length);
  
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
  
  console.log("Birthday reminders found:", result.length);
  result.sort((a, b) => a.birthday.getDate() - b.birthday.getDate());
  
  res.json({
    success: true,
    count: result.length,
    currentMonth,
    targetMonth,
    reminders: result
  });
});

// Other endpoints
app.get('/api/properties', (req, res) => {
  res.json({ success: true, count: storage.landlords.length, properties: storage.landlords });
});

app.get('/api/landlords', (req, res) => {
  res.json({ success: true, count: storage.landlords.length, landlords: storage.landlords });
});

app.get('/api/tenants', (req, res) => {
  res.json({ success: true, count: storage.tenants.length, tenants: storage.tenants });
});

// Use port 0 for auto-assignment (this worked in our test!)
const server = app.listen(0, () => {
  const address = server.address();
  const port = address.port;
  
  console.log(`
🚀 PropertyLinkPro Development Server Started!
📡 Server running on: http://localhost:${port}
🌐 Also try: http://127.0.0.1:${port}
🧪 Using auto-assigned port: ${port}

📋 Quick Test Commands:
curl "http://localhost:${port}/health"
curl "http://localhost:${port}/api/init-db"
curl "http://localhost:${port}/api/reminders/birthdays"

🌐 Open in browser: http://localhost:${port}
  `);
  
  // Test the server immediately
  console.log('🧪 Running self-test...');
  import('http').then(http => {
    const testReq = http.default.request(`http://localhost:${port}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Self-test SUCCESS:', JSON.parse(data).status);
      });
    });
    
    testReq.on('error', (err) => {
      console.log('❌ Self-test FAILED:', err.message);
    });
    
    testReq.end();
  });
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});