// Package imports
const http = require('http');

// server settings
const port = 8080;
const host = '127.0.0.1';

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("Hello");
}).listen(port, host, () => {
    console.log(`Listening to ${host}:${port}`);
});
