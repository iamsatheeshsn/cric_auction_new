const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello world');
});

server.listen(5001, () => {
    console.log('Simple server running on 5001');
    // Keep alive
    setInterval(() => {
        console.log('Heartbeat...');
    }, 5000);
});
