#!/bin/bash

# RemittancePay - Git Bash Stress Test Script
# Uses parallel curl processes to stress the Send Money API.

BASE_URL="http://localhost:3000"
USER_ID="RPAY007"
TOKEN="token_${USER_ID}_$(date +%s)"
NUM_REQUESTS=50
CONCURRENCY=5

echo "🔥 Starting Git Bash Stress Test"
echo "Target: $BASE_URL/api/transactions/send"
echo "Requests: $NUM_REQUESTS (Concurrency: $CONCURRENCY)"
echo "--------------------------------------------------"

send_request() {
    curl -s -X POST "$BASE_URL/api/transactions/send" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "toAddress": "0x2000000000000000000000000000000000000002",
        "amount": 0.01,
        "currency": "USD",
        "description": "Stress Test"
    }' > /dev/null
}

export -f send_request
export BASE_URL TOKEN

# Use xargs to handle concurrency in Git Bash/Linux environments
seq $NUM_REQUESTS | xargs -n 1 -P $CONCURRENCY -I {} bash -c "send_request"

echo "--------------------------------------------------"
echo "✅ Stress Test Finished"
