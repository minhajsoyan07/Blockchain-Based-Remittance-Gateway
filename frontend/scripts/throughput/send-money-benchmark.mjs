/**
 * RemittancePay - Send Money Throughput Benchmark
 * 
 * Measures Requests Per Second (RPS) for the Send Money API.
 * Uses Axios for high-performance concurrent requests.
 * 
 * Usage: node scripts/throughput/send-money-benchmark.mjs [numRequests] [concurrency]
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'RPAY007';
const TEST_TOKEN = `token_${TEST_USER_ID}_${Date.now()}`;

const NUM_REQUESTS = parseInt(process.argv[2]) || 100;
const CONCURRENCY = parseInt(process.argv[3]) || 10;

const payload = {
    toAddress: '0x1000000000000000000000000000000000000001',
    amount: 0.0001,
    currency: 'USD',
    description: 'Benchmark Transaction'
};

async function runBenchmark() {
    console.log(`\n🚀 Starting Throughput Benchmark`);
    console.log(`Target: ${BASE_URL}/api/transactions/send`);
    console.log(`Config: ${NUM_REQUESTS} total requests, ${CONCURRENCY} concurrent batches`);
    console.log('-'.repeat(50));

    const startTime = performance.now();
    let successCount = 0;
    let failCount = 0;

    const executeBatch = async (count) => {
        const tasks = [];
        for (let i = 0; i < count; i++) {
            tasks.push(
                axios.post(`${BASE_URL}/api/transactions/send`, payload, {
                    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
                })
                    .then(() => { successCount++; })
                    .catch((err) => {
                        failCount++;
                        if (failCount < 5) console.error(`      [ERR] ${err.response?.data?.error || err.message}`);
                    })
            );
        }
        await Promise.all(tasks);
    };

    const numBatches = Math.ceil(NUM_REQUESTS / CONCURRENCY);

    for (let i = 0; i < numBatches; i++) {
        const batchSize = Math.min(CONCURRENCY, NUM_REQUESTS - (i * CONCURRENCY));
        await executeBatch(batchSize);
        if ((i + 1) % 5 === 0) console.log(`  Progress: ${((i + 1) * CONCURRENCY / NUM_REQUESTS * 100).toFixed(0)}%`);
    }

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    const totalTimeSec = totalTimeMs / 1000;
    const rps = (NUM_REQUESTS / totalTimeSec).toFixed(2);

    console.log('-'.repeat(50));
    console.log(`✅ Benchmark Completed`);
    console.log(`Total Time: ${totalTimeSec.toFixed(2)}s`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Throughput: ${rps} Requests Per Second (RPS)`);
    console.log('-'.repeat(50));
}

runBenchmark().catch(console.error);
