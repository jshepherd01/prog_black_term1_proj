// Package imports
const http = require('http');
const express = require('express');

// server settings
const port = 8080;
const host = '127.0.0.1';

const app = express(http.createServer());

app.use(express.static('static/'));

app.listen(port, host, () => {
    console.log(`Listening to ${host}:${port}`);
});
