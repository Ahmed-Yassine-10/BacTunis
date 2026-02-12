const http = require('http');

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        };
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(responseData)); }
                catch { resolve(responseData); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    // Try to register first (will fail silently if user exists)
    console.log('=== Step 0: Register ===');
    try {
        const regResp = await post('/api/auth/register', {
            email: 'test@bactunis.tn',
            password: 'password123',
            firstName: 'Ahmed',
            lastName: 'Ben Ali',
            branch: 'SCIENCES',
            birthDate: '2007-05-15',
            grade: 'BAC',
        });
        console.log('Register:', regResp.accessToken ? 'OK (new user)' : regResp.message || 'exists');
    } catch(e) { console.log('Register skipped'); }

    console.log('\n=== Step 1: Login ===');
    const loginResp = await post('/api/auth/login', {
        email: 'test@bactunis.tn',
        password: 'password123',
    });
    const token = loginResp.accessToken;
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'FAILED');
    if (!token) { console.error('Login failed:', loginResp); return; }

    console.log('\n=== Step 2: Chat (simple message) ===');
    const chatResp = await post('/api/ai/chat', {
        content: 'Bonjour! Aide-moi avec les maths',
    }, token);
    console.log('ConvID:', chatResp.conversationId);
    console.log('Response:', chatResp.message?.content?.substring(0, 200));
    console.log('Suggestions:', chatResp.suggestions);
}

main().catch(console.error);
