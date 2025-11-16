const axios = require('axios');

async function testAPI() {
  try {
    // Test login
    console.log('=== Testing Login ===');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@baron.local',
      password: 'Admin123!'
    });
    
    console.log('Login successful!');
    console.log('Token:', loginRes.data.token.substring(0, 20) + '...');
    console.log('User:', loginRes.data.user.fullName, '-', loginRes.data.user.role.name);
    
    const token = loginRes.data.token;
    
    // Test getting cars
    console.log('\n=== Testing Cars API ===');
    const carsRes = await axios.get('http://localhost:5000/api/cars', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Cars found:', carsRes.data.cars?.length || 0);
    if (carsRes.data.cars?.[0]) {
      console.log('First car:', carsRes.data.cars[0].brand, carsRes.data.cars[0].model);
    }
    
    // Test getting customers
    console.log('\n=== Testing Customers API ===');
    const customersRes = await axios.get('http://localhost:5000/api/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Customers found:', customersRes.data.customers?.length || 0);
    
    // Test dashboard stats
    console.log('\n=== Testing Dashboard Stats API ===');
    const statsRes = await axios.get('http://localhost:5000/api/reports/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Stats:', JSON.stringify(statsRes.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPI();
