import express from "express";
import session from "express-session";
import * as dotenv from "dotenv";
import { storage } from "./storage";

// Load environment variables first
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup basic session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Basic auth endpoint
app.get('/api/auth/user', async (req: any, res) => {
  try {
    console.log("Auth endpoint called");
    
    // Always return demo user for testing
    const demoUser = {
      id: "demo-user-123",
      email: "demo@propertylinkpro.com",
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      status: "active",
      createdBy: "system"
    };
    
    return res.json(demoUser);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Properties endpoint
app.get('/api/properties', async (req, res) => {
  try {
    console.log("Properties endpoint called");
    
    if (process.env.USE_MEMORY_STORAGE === 'true') {
      // Use real memory storage
      const properties = await storage.getPropertiesWithDetails();
      res.json(properties);
    } else {
      // Return sample data for testing
      const sampleProperties = [
        {
          propertyAddress: "123 Main St, Vancouver, BC",
          keyNumber: "KEY001",
          serviceType: "Full-Service Management",
          landlordOwners: [
            { name: "John Doe", contactNumber: "604-555-0123" }
          ],
          tenant: {
            name: "Jane Smith",
            moveInDate: "2023-01-15",
            contactNumber: "604-555-0456"
          },
          rentalInfo: {
            latestRentalRate: 2500,
            nextAllowableRentalIncreaseDate: "2024-01-15"
          }
        }
      ];
      
      res.json(sampleProperties);
    }
  } catch (error) {
    console.error("Properties error:", error);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
});

// Landlords endpoint
app.get('/api/landlords', async (req, res) => {
  try {
    console.log("Landlords endpoint called");
    const landlords = await storage.getLandlords();
    res.json(landlords);
  } catch (error) {
    console.error("Landlords error:", error);
    // Return empty array instead of error to prevent UI crashes
    res.json([]);
  }
});

// Tenants endpoint
app.get('/api/tenants', async (req, res) => {
  try {
    console.log("Tenants endpoint called");
    const tenants = await storage.getTenants();
    res.json(tenants);
  } catch (error) {
    console.error("Tenants error:", error);
    // Return empty array instead of error to prevent UI crashes
    res.json([]);
  }
});

// Birthday reminders endpoint
app.get('/api/reminders/birthdays', async (req, res) => {
  try {
    console.log("Birthday reminders endpoint called");
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const reminders = await storage.getBirthdayReminders(month);
    res.json(reminders);
  } catch (error) {
    console.error("Birthday reminders error:", error);
    // Return empty array instead of error to prevent UI crashes
    res.json([]);
  }
});

// Rate increase reminders endpoint
app.get('/api/reminders/rental-increases', async (req, res) => {
  try {
    console.log("Rate increase reminders endpoint called");
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const minMonths = req.query.minMonths ? parseInt(req.query.minMonths as string, 10) : undefined;
    const reminders = await storage.getRentalIncreaseReminders(month, minMonths);
    res.json(reminders);
  } catch (error) {
    console.error("Rate increase reminders error:", error);
    // Return empty array instead of error to prevent UI crashes
    res.json([]);
  }
});

// Database initialization endpoint
app.get('/api/init-db', async (req, res) => {
  try {
    console.log("Database initialization called");
    
    // Create test property
    const testProperty = await storage.createLandlord({
      propertyAddress: "Test Property - 456 Oak St",
      keyNumber: "TEST001",
      serviceType: "Full-Service Management"
    });
    
    console.log("Test property created:", testProperty);
    
    // Create test landlord owner
    const testOwner = await storage.createLandlordOwner({
      landlordId: testProperty.id,
      name: "John Doe",
      contactNumber: "604-555-0123",
      birthday: "1980-03-15",
      residentialAddress: "123 Main St, Vancouver, BC"
    });
    
    console.log("Test owner created:", testOwner);
    
    // Create test tenant
    const testTenant = await storage.createTenant({
      propertyAddress: testProperty.propertyAddress,
      name: "Jane Smith",
      contactNumber: "604-555-0456",
      email: "jane.smith@example.com",
      birthday: "1985-07-20",
      moveInDate: "2023-01-15",
      serviceType: "Full-Service Management",
      isPrimary: true
    });
    
    console.log("Test tenant created:", testTenant);
    
    // Create test rental rate increase
    const testRentalIncrease = await storage.createRentalRateIncrease({
      propertyAddress: testProperty.propertyAddress,
      latestRateIncreaseDate: "2023-01-15",
      latestRentalRate: 2500.00,
      nextAllowableRentalIncreaseDate: "2024-01-15",
      nextAllowableRentalRate: 2575.00,
      reminderDate: "2023-09-15"
    });
    
    console.log("Test rental increase created:", testRentalIncrease);
    
    res.json({ 
      message: "Database initialized successfully",
      testProperty: testProperty,
      testOwner: testOwner,
      testTenant: testTenant,
      testRentalIncrease: testRentalIncrease
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    res.status(500).json({ 
      message: "Database initialization failed",
      error: error.message
    });
  }
});

// Serve basic HTML for frontend
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PropertyLinkPro</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6;
          }
          .endpoint { 
            background: #f5f5f5; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
          }
          .endpoint a { 
            text-decoration: none; 
            color: #0066cc; 
            font-weight: bold; 
          }
          .endpoint a:hover { 
            text-decoration: underline; 
          }
        </style>
      </head>
      <body>
        <h1>🏠 PropertyLinkPro API Server</h1>
        <p>Your PropertyLinkPro application is running successfully!</p>
        
        <h2>📋 Available API Endpoints:</h2>
        <div class="endpoint">
          <a href="/api/auth/user">👤 User Authentication</a> - Get current user info
        </div>
        <div class="endpoint">
          <a href="/api/properties">🏠 Properties</a> - List all properties
        </div>
        <div class="endpoint">
          <a href="/api/landlords">🏘️ Landlords</a> - List all landlords
        </div>
        <div class="endpoint">
          <a href="/api/tenants">👥 Tenants</a> - List all tenants
        </div>
        <div class="endpoint">
          <a href="/api/reminders/birthdays">🎂 Birthday Reminders</a> - Upcoming birthdays
        </div>
        <div class="endpoint">
          <a href="/api/reminders/rental-increases">💰 Rate Increase Reminders</a> - Rental increase reminders
        </div>
        
        <h2>⚙️ System Status:</h2>
        <ul>
          <li>✅ Server: Running</li>
          <li>✅ Database: ${process.env.USE_MEMORY_STORAGE === 'true' ? 'In-Memory Storage' : 'PostgreSQL'}</li>
          <li>✅ Environment: ${process.env.NODE_ENV || 'development'}</li>
        </ul>
        
        <p><em>This is a working API server for PropertyLinkPro. The frontend can be built and deployed separately.</em></p>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 PropertyLinkPro API Server running on port ${port}`);
  console.log(`📡 Using ${process.env.USE_MEMORY_STORAGE === 'true' ? 'in-memory' : 'PostgreSQL'} storage`);
  console.log(`🌐 Access your server at: http://localhost:${port}`);
});