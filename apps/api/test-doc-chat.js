const http = require('http');
const fs = require('fs');
const path = require('path');

function request(method, urlPath, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
        const isMultipart = typeof body === 'string' && body.includes('--boundary');
        const headers = {
            ...(isMultipart 
                ? { 'Content-Type': 'multipart/form-data; boundary=boundary' }
                : { 'Content-Type': 'application/json' }),
            'Content-Length': Buffer.byteLength(data),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
        const options = { hostname: 'localhost', port: 3001, path: urlPath, method, headers };
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(responseData)); }
                catch { resolve(responseData); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function uploadFile(urlPath, filePath, token) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);
        const boundary = '----FormBoundary' + Date.now();
        
        let body = Buffer.concat([
            Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: text/plain\r\n\r\n`),
            fileContent,
            Buffer.from(`\r\n--${boundary}--\r\n`),
        ]);
        
        const options = {
            hostname: 'localhost', port: 3001, path: urlPath, method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length,
                'Authorization': `Bearer ${token}`,
            },
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    // Login
    console.log('=== Login ===');
    const loginResp = await request('POST', '/api/auth/login', {
        email: 'test@bactunis.tn', password: 'password123'
    });
    const token = loginResp.accessToken;
    if (!token) { console.error('Login failed:', loginResp); return; }
    console.log('✅ Login OK\n');

    // Upload document
    console.log('=== Upload Document ===');
    const testFile = path.join(__dirname, 'test_doc.txt');
    if (!fs.existsSync(testFile)) {
        fs.writeFileSync(testFile, `Chapitre: Les fonctions exponentielles

L'exponentielle de base e est la fonction exp définie sur R par exp(x) = e^x.

Propriétés fondamentales:
1. exp(0) = 1
2. exp(1) = e ≈ 2.718
3. Pour tout x et y réels: exp(x+y) = exp(x) × exp(y)
4. Pour tout x réel: exp(-x) = 1/exp(x)
5. La dérivée de exp est exp elle-même: (e^x)' = e^x

Limites importantes:
- lim(x→+∞) e^x = +∞
- lim(x→-∞) e^x = 0
- lim(x→+∞) e^x/x^n = +∞ (croissance comparée)
- lim(x→-∞) x^n × e^x = 0 (croissance comparée)

Applications au baccalauréat tunisien:
- Étude de fonctions du type f(x) = (ax+b)e^x
- Calcul d'aires entre courbes
- Équations différentielles y' = ky`);
    }
    const uploadResp = await uploadFile('/api/ai/documents/upload', testFile, token);
    console.log('Upload result:', uploadResp.id ? `✅ Doc ID: ${uploadResp.id}` : uploadResp);
    
    if (!uploadResp.id) return;
    
    // Chat with document
    console.log('\n=== Chat WITH Document ===');
    const chatResp = await request('POST', '/api/ai/chat', {
        content: 'Résume le document joint et donne-moi un exercice basé dessus',
        documentIds: [uploadResp.id],
    }, token);
    
    console.log('ConvID:', chatResp.conversationId);
    console.log('AI Response:');
    console.log(chatResp.message?.content?.substring(0, 500) || JSON.stringify(chatResp).substring(0, 500));
    console.log('\nSuggestions:', chatResp.suggestions);
}

main().catch(console.error);
