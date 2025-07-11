// Direct API testing without server
console.log('🧪 Testing PropertyLinkPro API Logic Directly');
console.log('===========================================');

// Simple in-memory storage
const storage = {
  landlords: [],
  landlordOwners: [],
  tenants: [],
  rentalRateIncreases: [],
  nextId: 1
};

// Initialize test data function
function initTestData() {
  console.log('\n🔄 Initializing test data...');
  
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
  
  console.log('✅ Test data created:');
  console.log('   - Property:', testProperty.propertyAddress);
  console.log('   - Owner:', testOwner.name, '(birthday:', testOwner.birthday, ')');
  console.log('   - Tenant:', testTenant.name, '(birthday:', testTenant.birthday, ')');
}

// Birthday reminders function
function getBirthdayReminders(month) {
  console.log('\n🎂 Testing Birthday Reminders...');
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const targetMonth = month || currentMonth;
  
  console.log('Current date:', currentDate.toISOString());
  console.log('Current month:', currentMonth);
  console.log('Target month:', targetMonth);
  console.log('Total landlord owners:', storage.landlordOwners.length);
  console.log('Total tenants:', storage.tenants.length);
  
  const result = [];
  
  // Check landlord owners
  for (const owner of storage.landlordOwners) {
    console.log('\nChecking owner:', owner.name, 'birthday:', owner.birthday);
    if (owner.birthday) {
      const birthday = new Date(owner.birthday);
      const birthdayMonth = birthday.getMonth() + 1;
      console.log('  - Birthday month:', birthdayMonth, 'vs target month:', targetMonth);
      if (birthdayMonth === targetMonth) {
        console.log('  - ✅ MATCH! Adding to results');
        result.push({
          name: owner.name,
          role: 'Landlord',
          contactNumber: owner.contactNumber || 'N/A',
          birthday: new Date(owner.birthday),
          propertyAddress: owner.residentialAddress || 'N/A'
        });
      } else {
        console.log('  - ❌ No match');
      }
    }
  }
  
  // Check tenants
  for (const tenant of storage.tenants) {
    console.log('\nChecking tenant:', tenant.name, 'birthday:', tenant.birthday);
    if (tenant.birthday) {
      const birthday = new Date(tenant.birthday);
      const birthdayMonth = birthday.getMonth() + 1;
      console.log('  - Birthday month:', birthdayMonth, 'vs target month:', targetMonth);
      if (birthdayMonth === targetMonth) {
        console.log('  - ✅ MATCH! Adding to results');
        result.push({
          name: tenant.name,
          role: 'Tenant',
          contactNumber: tenant.contactNumber || 'N/A',
          birthday: new Date(tenant.birthday),
          propertyAddress: tenant.propertyAddress
        });
      } else {
        console.log('  - ❌ No match');
      }
    }
  }
  
  console.log('\n📊 Results:');
  console.log('Total birthday reminders found:', result.length);
  result.forEach((reminder, index) => {
    console.log(`${index + 1}. ${reminder.name} (${reminder.role}) - ${reminder.birthday.toDateString()}`);
  });
  
  return result;
}

// Run the tests
console.log('\n' + '='.repeat(50));
initTestData();
console.log('\n' + '='.repeat(50));
getBirthdayReminders(); // Current month
console.log('\n' + '='.repeat(50));
getBirthdayReminders(7); // July specifically
console.log('\n' + '='.repeat(50));
console.log('✨ Testing complete!');