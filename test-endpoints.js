// Test script for API endpoints
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000';

function curl(endpoint, description) {
  console.log(`\n🔍 Testing ${description}:`);
  console.log(`   ${BASE_URL}${endpoint}`);
  try {
    const result = execSync(`curl -s "${BASE_URL}${endpoint}"`, { encoding: 'utf8' });
    console.log(`   ✅ Response: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

function testEndpoints() {
  console.log('🧪 Testing PropertyLinkPro API Endpoints');
  console.log('==========================================');
  
  // Test basic connectivity
  curl('/', 'Root endpoint');
  
  // Initialize test data
  curl('/api/init-db', 'Initialize test data');
  
  // Test all endpoints
  curl('/api/auth/user', 'Authentication');
  curl('/api/properties', 'Properties');
  curl('/api/landlords', 'Landlords');
  curl('/api/tenants', 'Tenants');
  curl('/api/reminders/birthdays', 'Birthday reminders');
  curl('/api/reminders/rental-increases', 'Rental increase reminders');
  
  console.log('\n✨ Testing complete!');
}

// Run the tests
testEndpoints();