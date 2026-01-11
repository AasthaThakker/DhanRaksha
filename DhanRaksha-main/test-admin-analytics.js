// Test script for Admin Analytics API
// Run this to test all the new admin analytics endpoints

const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
  name: 'Test Analytics User',
  email: 'testuser@example.com',
  password: 'Test@123',
  initialDeposit: 1000
};

async function testAdminAnalytics() {
  console.log('🔍 Testing Admin Analytics API...\n');

  try {
    // 1. Test main analytics endpoint
    console.log('1. Testing GET /api/admin/analytics');
    const analyticsResponse = await fetch(`${BASE_URL}/api/admin/analytics?page=1&limit=5`);
    const analyticsData = await analyticsResponse.json();
    
    if (analyticsData.success) {
      console.log('✅ Main analytics endpoint working');
      console.log(`   - Total users: ${analyticsData.data.analytics.overview.totalUsers}`);
      console.log(`   - Total balance: ${analyticsData.data.analytics.overview.totalBalance}`);
      console.log(`   - Users returned: ${analyticsData.data.users.length}`);
    } else {
      console.log('❌ Main analytics endpoint failed:', analyticsData.error);
    }

    // 2. Test user-specific analytics (if we have users)
    if (analyticsData.success && analyticsData.data.users.length > 0) {
      const testUserId = analyticsData.data.users[0].id;
      
      console.log('\n2. Testing GET /api/admin/user-analytics');
      const userAnalyticsResponse = await fetch(`${BASE_URL}/api/admin/user-analytics?userId=${testUserId}`);
      const userAnalyticsData = await userAnalyticsResponse.json();
      
      if (userAnalyticsData.success) {
        console.log('✅ User analytics endpoint working');
        console.log(`   - User: ${userAnalyticsData.user.name}`);
        console.log(`   - Account age: ${userAnalyticsData.user.analytics.overview.accountAge} days`);
        console.log(`   - Total transactions: ${userAnalyticsData.user.analytics.transactions.total}`);
        console.log(`   - Risk level: ${userAnalyticsData.user.analytics.overview.riskLevel}`);
      } else {
        console.log('❌ User analytics endpoint failed:', userAnalyticsData.error);
      }
    }

    // 3. Test bulk operations statistics
    console.log('\n3. Testing GET /api/admin/bulk-operations');
    const bulkOpsResponse = await fetch(`${BASE_URL}/api/admin/bulk-operations`);
    const bulkOpsData = await bulkOpsResponse.json();
    
    if (bulkOpsData.success) {
      console.log('✅ Bulk operations stats working');
      console.log(`   - Total users: ${bulkOpsData.statistics.overview.totalUsers}`);
      console.log(`   - Blocked users: ${bulkOpsData.statistics.overview.blockedUsers}`);
      console.log(`   - High-risk users: ${bulkOpsData.statistics.overview.highRiskUsers}`);
    } else {
      console.log('❌ Bulk operations stats failed:', bulkOpsData.error);
    }

    // 4. Test creating a new user
    console.log('\n4. Testing POST /api/admin/analytics (Create User)');
    const createResponse = await fetch(`${BASE_URL}/api/admin/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const createData = await createResponse.json();
    if (createData.success) {
      console.log('✅ User creation working');
      console.log(`   - Created user: ${createData.user.email}`);
      console.log(`   - User ID: ${createData.user.id}`);
      console.log(`   - Initial balance: ${createData.user.balance}`);
      
      // Test updating the created user
      console.log('\n5. Testing PUT /api/admin/analytics (Update User)');
      const updateResponse = await fetch(`${BASE_URL}/api/admin/analytics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: createData.user.id,
          name: 'Updated Test User',
          email: 'updated@example.com',
          role: 'USER',
          balance: 2000,
          receiveAnomalyProtection: true
        })
      });
      
      const updateData = await updateResponse.json();
      if (updateData.success) {
        console.log('✅ User update working');
        console.log(`   - Updated name: ${updateData.user.name}`);
        console.log(`   - Updated balance: ${updateData.user.totalBalance}`);
      } else {
        console.log('❌ User update failed:', updateData.error);
      }
      
      // Test bulk operations with the new user
      console.log('\n6. Testing POST /api/admin/bulk-operations (Bulk Export)');
      const bulkExportResponse = await fetch(`${BASE_URL}/api/admin/bulk-operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'EXPORT',
          userIds: [createData.user.id]
        })
      });
      
      const bulkExportData = await bulkExportResponse.json();
      if (bulkExportData.success) {
        console.log('✅ Bulk export working');
        console.log(`   - Exported users: ${bulkExportData.users.length}`);
      } else {
        console.log('❌ Bulk export failed:', bulkExportData.error);
      }
      
    } else {
      console.log('❌ User creation failed:', createData.error);
    }

    console.log('\n🎉 Admin Analytics API testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Development server is running on http://localhost:3000');
    console.log('   - You are logged in as an admin user');
    console.log('   - Database connection is working');
  }
}

// Run the test
testAdminAnalytics();
