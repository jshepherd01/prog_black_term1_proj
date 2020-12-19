const app = require('./app');

// server settings
const port = 8080;
const host = '127.0.0.1';

app.listen(port, host, () => {
    console.log(`Listening to ${host}:${port}`);
});
