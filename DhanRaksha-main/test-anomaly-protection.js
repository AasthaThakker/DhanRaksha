// Test script for anomaly protection functionality
// This script tests the API endpoints directly

const BASE_URL = 'http://localhost:3000';

async function testAnomalyProtection() {
    console.log('🧪 Testing Anomaly Protection Feature...\n');

    try {
        // Test 1: Check if security API returns the new field
        console.log('1. Testing GET /api/user/security...');
        const getResponse = await fetch(`${BASE_URL}/api/user/security`);
        
        if (getResponse.ok) {
            const data = await getResponse.json();
            console.log('✅ GET security API works');
            console.log('Response includes receiveAnomalyProtection:', 'receiveAnomalyProtection' in data);
            console.log('Current value:', data.receiveAnomalyProtection);
        } else {
            console.log('❌ GET security API failed:', getResponse.status);
        }

        // Test 2: Test PUT to enable anomaly protection
        console.log('\n2. Testing PUT /api/user/security (enable)...');
        const putResponse = await fetch(`${BASE_URL}/api/user/security`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                receiveAnomalyProtection: true
            })
        });

        if (putResponse.ok) {
            const data = await putResponse.json();
            console.log('✅ PUT security API works');
            console.log('Updated value:', data.receiveAnomalyProtection);
        } else {
            console.log('❌ PUT security API failed:', putResponse.status);
            const error = await putResponse.text();
            console.log('Error:', error);
        }

        // Test 3: Test PUT to disable anomaly protection
        console.log('\n3. Testing PUT /api/user/security (disable)...');
        const disableResponse = await fetch(`${BASE_URL}/api/user/security`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                receiveAnomalyProtection: false
            })
        });

        if (disableResponse.ok) {
            const data = await disableResponse.json();
            console.log('✅ Disable anomaly protection works');
            console.log('Updated value:', data.receiveAnomalyProtection);
        } else {
            console.log('❌ Disable failed:', disableResponse.status);
        }

        console.log('\n🎉 Anomaly protection API tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testAnomalyProtection();
