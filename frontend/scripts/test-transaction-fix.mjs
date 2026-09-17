import fetch from 'node-fetch';

async function testSendMoney() {
    const userId = 'RPAY007'; // Stress Test User with 260 USD
    const token = `token_${userId}_${Date.now()}`;
    const apiUrl = 'http://localhost:3000/api/transactions/send';

    console.log(`Testing Send Money for ${userId} (USD balance)...`);

    const payload = {
        toAddress: '0x1234567890123456789012345678901234567890',
        amount: 10,
        currency: 'USD',
        description: 'Test USD Transfer'
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success:', data.message);
            console.log('New Balance:', data.newBalance);
        } else {
            console.log('❌ Failed:', data.error);
            console.log('Message:', data.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSendMoney();
