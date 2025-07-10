// Quick test script for birthday reminders
import { MemStorage } from './server/storage.js';

async function testBirthdayReminders() {
  console.log("=== Testing Birthday Reminders ===");
  
  const storage = new MemStorage();
  
  // Create test data
  console.log("1. Creating test landlord...");
  const testProperty = await storage.createLandlord({
    propertyAddress: "Test Property - 456 Oak St",
    keyNumber: "TEST001",
    serviceType: "Full-Service Management"
  });
  console.log("Created property:", testProperty);
  
  console.log("2. Creating test landlord owner...");
  const testOwner = await storage.createLandlordOwner({
    landlordId: testProperty.id,
    name: "John Doe",
    contactNumber: "604-555-0123",
    birthday: "1980-07-25",
    residentialAddress: "123 Main St, Vancouver, BC"
  });
  console.log("Created owner:", testOwner);
  
  console.log("3. Creating test tenant...");
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
  console.log("Created tenant:", testTenant);
  
  console.log("4. Getting birthday reminders...");
  const reminders = await storage.getBirthdayReminders();
  console.log("Birthday reminders:", reminders);
  
  console.log("5. Test complete!");
}

testBirthdayReminders().catch(console.error);