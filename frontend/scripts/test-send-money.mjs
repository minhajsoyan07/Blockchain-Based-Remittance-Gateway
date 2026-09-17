/**
 * RemittancePay - Send Money API Test Suite
 * 
 * This script performs automated testing of the /api/transactions/send endpoint.
 * It covers success scenarios, balance validation, and error handling.
 * 
 * Usage: node scripts/test-send-money.mjs
 */

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'RPAY007'; // Stress Test User (has USD balance)
const TEST_TOKEN = `token_${TEST_USER_ID}_${Date.now()}`;

const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

async function runTest(name, payload, expectedStatus) {
    console.log(`${COLORS.bright}TEST: ${name}${COLORS.reset}`);

    try {
        const response = await fetch(`${BASE_URL}/api/transactions/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const isSuccess = response.status === expectedStatus;

        if (isSuccess) {
            console.log(`${COLORS.green}  [PASS] Status: ${response.status}${COLORS.reset}`);
            if (data.transaction) console.log(`  [INFO] TX ID: ${data.transaction.id}`);
            if (data.newBalance !== undefined) console.log(`  [INFO] New Balance: ${data.newBalance}`);
        } else {
            console.log(`${COLORS.red}  [FAIL] Expected ${expectedStatus}, got ${response.status}${COLORS.reset}`);
            console.log(`  [ERROR] ${data.error || 'Unknown error'}: ${data.message || ''}`);
        }
    } catch (error) {
        console.log(`${COLORS.red}  [ERROR] Request failed: ${error.message}${COLORS.reset}`);
    }
    console.log('-'.repeat(50));
}

async function startTestSuite() {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== RemittancePay API Testing suite ===${COLORS.reset}\n`);
    console.log(`Target: ${BASE_URL}/api/transactions/send`);
    console.log(`Tester: ${TEST_USER_ID}`);
    console.log('-'.repeat(50));

    // 1. Success Case: USD Transfer
    await runTest('Successful USD Transfer', {
        toAddress: '0x1000000000000000000000000000000000000001',
        amount: 1,
        currency: 'USD',
        description: 'Automated test transfer'
    }, 200);

    // 2. Error Case: Insufficient Balance
    await runTest('Insufficient Balance Detection', {
        toAddress: '0x1000000000000000000000000000000000000001',
        amount: 999999,
        currency: 'USD'
    }, 400);

    // 3. Error Case: Invalid Wallet Address
    await runTest('Invalid Wallet Address Validation', {
        toAddress: 'invalid-address',
        amount: 1,
        currency: 'USD'
    }, 400);

    // 4. Error Case: Missing Fields
    await runTest('Required Field Validation (Missing Address)', {
        amount: 1,
        currency: 'USD'
    }, 400);

    // 5. Auth Case: Missing Token (Custom test)
    console.log(`${COLORS.bright}TEST: Unauthorized Access${COLORS.reset}`);
    try {
        const res = await fetch(`${BASE_URL}/api/transactions/send`, { method: 'POST' });
        if (res.status === 401) {
            console.log(`${COLORS.green}  [PASS] Status: 401${COLORS.reset}`);
        } else {
            console.log(`${COLORS.red}  [FAIL] Expected 401, got ${res.status}${COLORS.reset}`);
        }
    } catch (e) {
        console.log(`${COLORS.red}  [ERROR] ${e.message}${COLORS.reset}`);
    }

    console.log(`\n${COLORS.cyan}${COLORS.bright}=== Testing Completed ===${COLORS.reset}\n`);
}

startTestSuite();
