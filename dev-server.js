// Simple development server
import express from 'express';
import { storage } from './server/storage.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Force memory storage for local development
process.env.USE_MEMORY_STORAGE = 'true';
process.env.NODE_ENV = 'development';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Basic auth endpoint
app.get('/api/auth/user', (req, res) => {
  res.json({
    id: "demo-user-123",
    email: "demo@propertylinkpro.com",
    firstName: "Demo",
    lastName: "User",
    role: "admin"
  });
});

// Database initialization endpoint
app.get('/api/init-db', async (req, res) => {
  try {
    console.log("🔄 Initializing test data...");
    
    // Create test property
    const testProperty = await storage.createLandlord({
      propertyAddress: "Test Property - 456 Oak St",
      keyNumber: "TEST001",
      serviceType: "Full-Service Management"
    });
    
    // Create test landlord owner
    const testOwner = await storage.createLandlordOwner({
      landlordId: testProperty.id,
      name: "John Doe",
      contactNumber: "604-555-0123",
      birthday: "1980-07-25",
      residentialAddress: "123 Main St, Vancouver, BC"
    });
    
    // Create test tenant
    const testTenant = await storage.createTenant({
      propertyAddress: testProperty.propertyAddress,
      name: "Jane Smith",
      contactNumber: "604-555-0456",
      email: "jane.smith@example.com",
      birthday: "1985-07-09",
      moveInDate: "2023-01-15",
      serviceType: "Full-Service Management",
      isPrimary: true
    });
    
    // Create test rental rate increase
    const testRentalIncrease = await storage.createRentalRateIncrease({
      propertyAddress: testProperty.propertyAddress,
      latestRateIncreaseDate: "2023-01-15",
      latestRentalRate: 2500.00,
      nextAllowableRentalIncreaseDate: "2024-01-15",
      nextAllowableRentalRate: 2575.00,
      reminderDate: "2023-09-15"
    });
    
    console.log("✅ Test data created successfully!");
    res.json({ 
      message: "Database initialized successfully",
      testProperty,
      testOwner,
      testTenant,
      testRentalIncrease
    });
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    res.status(500).json({ 
      message: "Database initialization failed",
      error: error.message
    });
  }
});

// Properties endpoint
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await storage.getPropertiesWithDetails();
    res.json(properties);
  } catch (error) {
    console.error("Properties error:", error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
});

// Landlords endpoint
app.get('/api/landlords', async (req, res) => {
  try {
    const landlords = await storage.getLandlords();
    res.json(landlords);
  } catch (error) {
    console.error("Landlords error:", error);
    res.json([]);
  }
});

// Tenants endpoint
app.get('/api/tenants', async (req, res) => {
  try {
    const tenants = await storage.getTenants();
    res.json(tenants);
  } catch (error) {
    console.error("Tenants error:", error);
    res.json([]);
  }
});

// Birthday reminders endpoint
app.get('/api/reminders/birthdays', async (req, res) => {
  try {
    console.log("🎂 Birthday reminders endpoint called");
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    
    console.log("Current date:", currentDate.toISOString());
    console.log("Current month:", currentMonth);
    console.log("Requested month:", month);
    
    const reminders = await storage.getBirthdayReminders(month);
    console.log("Birthday reminders found:", reminders.length);
    console.log("Reminders:", JSON.stringify(reminders, null, 2));
    
    res.json(reminders);
  } catch (error) {
    console.error("Birthday reminders error:", error);
    res.json([]);
  }
});

// Rate increase reminders endpoint
app.get('/api/reminders/rental-increases', async (req, res) => {
  try {
    console.log("💰 Rate increase reminders endpoint called");
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const minMonths = req.query.minMonths ? parseInt(req.query.minMonths as string, 10) : undefined;
    const reminders = await storage.getRentalIncreaseReminders(month, minMonths);
    res.json(reminders);
  } catch (error) {
    console.error("Rate increase reminders error:", error);
    res.json([]);
  }
});

// Root endpoint - simple API status
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 PropertyLinkPro Development Server Started!
📡 Server running on: http://localhost:${PORT}
🧪 Using in-memory storage (no database required)

📋 Quick Test Commands:
curl "http://localhost:${PORT}/api/init-db"
curl "http://localhost:${PORT}/api/reminders/birthdays"
curl "http://localhost:${PORT}/api/properties"

🌐 Open in browser: http://localhost:${PORT}
  `);
});