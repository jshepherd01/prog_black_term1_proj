// package imports
const http = require('http');
const express = require('express');
const multer = require('multer');

// server settings
const port = 8080;
const host = '127.0.0.1';

// error types
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;
    }
}

const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        /* temporary only TODO: fix this */
        cb(null, file.originalname);
    }
});
const uploadFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new ValidationError('file is not an image file'));
    }
};
const upload = multer({
    storage: uploadStorage,
    fileFilter: uploadFilter
});

const app = express(http.createServer());

app.use(express.static('static/'));

app.post('/image/upload', upload.single('file'), (req, res) => {
    /* TODO: validate request */
    if (!req.file) {
        throw new ValidationError('no file specified');
    }

    /* TODO: process request */

    /* TODO: send response */
    res.status(200).json({"image-id": "000001"});
});

app.listen(port, host, () => {
    console.log(`Listening to ${host}:${port}`);
});
