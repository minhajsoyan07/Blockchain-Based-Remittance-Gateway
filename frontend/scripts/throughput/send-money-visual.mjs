/**
 * RemittancePay - Enhanced Send Money Throughput Reporter
 * 
 * A visually optimized throughput tester for the Send Money API.
 * Matches the UI specification provided by the user.
 * 
 * Usage: node scripts/throughput/send-money-visual.mjs
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// ============================================================================
// Configuration
// ============================================================================
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'ayesha@gmail.com';
const TEST_PASSWORD = 'Password123';
const TOTAL_TRANSFERS = 100;
const BATCH_SIZE = 10;
const CURRENCIES = ['USD', 'BDT', 'EUR', 'GBP']; // Currencies usually available after Add Money test
const RECIPIENT_ADDRESS = '0x1000000000000000000000000000000000000001';

// ASCII/ANSI Styles
const STYLE = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    dim: "\x1b[2m"
};

const ICONS = {
    plus: STYLE.magenta + "+" + STYLE.reset,
    diamond: STYLE.cyan + "♦" + STYLE.reset,
    check: STYLE.green + "✓" + STYLE.reset,
    cross: STYLE.red + "x" + STYLE.reset,
    hourglass: STYLE.blue + "⌛" + STYLE.reset
};

// ============================================================================
// State Management
// ============================================================================
let authToken = '';
let successCount = 0;
let failCount = 0;
const totalsByCurrency = { USD: 0, BDT: 0, EUR: 0, GBP: 0 };
const responseTimes = [];

// ============================================================================
// Core Logic
// ============================================================================

async function authenticate() {
    process.stdout.write(`${ICONS.diamond} Authenticating...`);
    try {
        const res = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        authToken = res.data.token;
        console.log(`\r${ICONS.check} Authenticated      `);
        return true;
    } catch (err) {
        console.log(`\r${ICONS.cross} Authentication Failed: ${err.message}`);
        return false;
    }
}

async function runTest() {
    console.log("=".repeat(60));
    console.log(`${ICONS.plus} SEND MONEY THROUGHPUT TEST`);
    console.log(`  Requests: ${TOTAL_TRANSFERS} | Batch: ${BATCH_SIZE}`);
    console.log(`  User: ${TEST_EMAIL}`);
    console.log(`  Endpoint: ${BASE_URL}/api/transactions/send`);
    console.log("=".repeat(60));
    console.log("");

    if (!(await authenticate())) return;

    // Pre-test: Ensure user has some balance by doing one large Add Money if needed
    // This ensures the throughput test doesn't fail due to "Insufficient Balance"
    process.stdout.write(`${ICONS.diamond} Preparing funds...`);
    try {
        await axios.post(`${BASE_URL}/api/transactions/add-money`, {
            amount: 10000,
            currency: 'USD',
            paymentMethod: 'Test Prep'
        }, { headers: { 'Authorization': `Bearer ${authToken}` } });
        await axios.post(`${BASE_URL}/api/transactions/add-money`, {
            amount: 100000,
            currency: 'BDT',
            paymentMethod: 'Test Prep'
        }, { headers: { 'Authorization': `Bearer ${authToken}` } });
        console.log(`\r${ICONS.check} Funds Ready        `);
    } catch (e) {
        console.log(`\r${ICONS.yellow} Warning: Fund preparation failed, test may report insufficient balance errors.`);
    }

    console.log(`\n${ICONS.hourglass} Starting send money test...\n`);

    const startTime = performance.now();
    const numBatches = Math.ceil(TOTAL_TRANSFERS / BATCH_SIZE);

    for (let b = 1; b <= numBatches; b++) {
        const tasks = [];
        const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_TRANSFERS - (successCount + failCount));

        for (let i = 0; i < currentBatchSize; i++) {
            const currency = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
            const amount = (Math.random() * 5 + 1).toFixed(2);

            const reqStart = performance.now();
            tasks.push(
                axios.post(`${BASE_URL}/api/transactions/send`, {
                    toAddress: RECIPIENT_ADDRESS,
                    amount: amount,
                    currency: currency,
                    description: 'Throughput Test Transfer'
                }, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }).then(() => {
                    successCount++;
                    totalsByCurrency[currency] += parseFloat(amount);
                    responseTimes.push(performance.now() - reqStart);
                }).catch(() => {
                    failCount++;
                })
            );
        }

        await Promise.all(tasks);
        const progress = Math.round((b / numBatches) * 100);
        process.stdout.write(`\r${ICONS.diamond} Batch ${b}/${numBatches} (${progress}%) [${ICONS.check} ${successCount} | ${ICONS.cross} ${failCount}]`);
    }

    const totalTimeMs = performance.now() - startTime;
    const totalTimeSec = totalTimeMs / 1000;
    const rps = (TOTAL_TRANSFERS / totalTimeSec).toFixed(2);
    const avgTime = (responseTimes.reduce((a, b) => a + b, 0) / (responseTimes.length || 1) / 1000).toFixed(3);
    const transfersPerMin = Math.round(parseFloat(rps) * 60);

    console.log("\n");
    console.log("=".repeat(60));
    console.log(`${STYLE.green}Duration: ${totalTimeSec.toFixed(2)}s${STYLE.reset}`);
    console.log(`${STYLE.bright}Total Requests: ${TOTAL_TRANSFERS}${STYLE.reset}`);
    console.log(`${STYLE.green}Successful: ${successCount}${STYLE.reset}`);
    console.log(`${STYLE.red}Failed: ${failCount}${STYLE.reset}`);
    console.log(`${STYLE.yellow}Throughput: ${rps} RPS${STYLE.reset}`);
    console.log(`${STYLE.green}Success Rate: ${((successCount / TOTAL_TRANSFERS) * 100).toFixed(2)}%${STYLE.reset}`);
    console.log("=".repeat(60));

    console.log(`\n${ICONS.diamond} Statistics:`);
    console.log(`  • Average time per transfer: ${avgTime}s`);
    console.log(`  • Transfers per minute: ${transfersPerMin}`);
    console.log(`  • Success rate: ${((successCount / TOTAL_TRANSFERS) * 100).toFixed(1)}%`);

    console.log(`\n${ICONS.diamond} Total volume sent by currency:`);
    Object.entries(totalsByCurrency).forEach(([cur, total]) => {
        let formattedTotal = total.toLocaleString(undefined, { minimumFractionDigits: 2 });
        console.log(`  • ${cur}: ${formattedTotal}`);
    });
    console.log("");
}

runTest().catch(console.error);
