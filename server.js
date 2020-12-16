// package imports
const http = require('http');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const mime = require('mime-types');

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

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
    }
}

const errorResponse = (err, req, res) => {
    switch (err.name) {
        case 'ValidationError':
            res.status(400).send({
                'invalid': err.message,
                'error-type': err.name
            });
            break;
        case 'NotFoundError':
            res.status(404).send('not found\n'); // TODO
            break;
        default:
            res.status(500).send('an unexpected error occurred\n'); // TODO
            break;
    }
};

const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        let uid = uuidv4();
        let ext = mime.extension(file.mimetype);
        cb(null, `${uid}.${ext}`);
    }
});

const uploadFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new ValidationError('file'));
    }
};

const upload = multer({
    storage: uploadStorage,
    fileFilter: uploadFilter
});

const app = express(http.createServer());

app.use(express.static('static/'));

app.post('/image/upload', upload.single('file'), (req, res) => {
    let newEntry = {};
    let uuid = '';

    /* validate request */
    if (!req.file) { // request must include a file
        return errorResponse(new ValidationError('file'), req, res); // if the file is the wrong type multer will handle it
    }
    uuid = req.file.filename.split('.')[0];
    newEntry['uri'] = req.file.filename;

    if (!req.body['title'] || typeof req.body['title'] !== 'string') { // request must include a title
        return errorResponse(new ValidationError('title'), req, res);
    }
    newEntry['title'] = req.body['title'];

    if (req.body['view-pass']) {
        if (typeof req.body['view-pass'] === 'string') { // if the view-pass is set, it must be a string
            newEntry['view-pass'] = req.body['view-pass'];
        } else {
            return errorResponse(new ValidationError('view-pass'));
        }
    } else {
        newEntry['view-pass'] = ''; // if no view-pass is set, use default value
    }

    if (!req.body['edit-pass'] || typeof req.body['edit-pass'] !== 'string') { // request must include an edit passcode
        return errorResponse(new ValidationError('edit-pass'), req, res);
    }
    newEntry['edit-pass'] = req.body['edit-pass'];

    // the inability of a formdata to transmit booleans vexes me
    if (req.body['nsfw']) {
        if (typeof req.body['nsfw'] === 'boolean') { // if nsfw is set, it must be either a boolean (easy)
            newEntry['nsfw'] = req.body['nsfw'];
        } else if (typeof req.body['nsfw'] === 'string') { // or a string 'true' or 'false' (not easy)
            if (req.body['nsfw'] === 'true') { // if it's 'true', it's true
                newEntry['nsfw'] = true;
            } else if (req.body['nsfw'] === 'false') { // if it's 'false', it's false
                newEntry['nsfw'] = false;
            } else {
                return errorResponse(new ValidationError('nsfw'), req, res); // if it's neither, it's ValidationError
            }
        } else {
            return errorResponse(new ValidationError('nsfw'), req, res); // if it's a weird data type like a number or something, also error
        }
    } else {
        newEntry['nsfw'] = false; // if it's not set at all, default to false
    }

    if (req.body['author']) {
        if (typeof req.body['author'] === 'string') { // author is another optional string
            newEntry['author'] = req.body['author'];
        } else {
            return errorResponse(new ValidationError('author'), req, res);
        }
    } else {
        newEntry['author'] = ''; // default value
    }

    if (req.body['copyright']) {
        if (typeof req.body['copyright'] === 'string') { // same again for copyright
            newEntry['copyright'] = req.body['copyright'];
        } else {
            return errorResponse(new ValidationError('copyright'), req, res);
        }
    } else {
        newEntry['author'] = '';
    }

    newEntry['alt-text'] = '';
    newEntry['origin-ip'] = req.ip;
    newEntry['timestamp'] = Date.now();

    /* process request */
    fs.readFile('data/image-db.json', (err, data) => { // read the json into memory
        // terrible way of doing it but I don't have a realy databse so :\
        if (err) return errorResponse(err, req, res); // throw the error, if one is encountered. Client will see it as a 500.
        let imagesDb = JSON.parse(data); // parse JSON
        imagesDb[uuid] = newEntry; // add the new thing
        fs.writeFile('data/image-db.json', JSON.stringify(imagesDb), (err) => { // write the JSON back to file
            if (err) return errorResponse(err, req, res); // keep throwing any and all errors
            res.status(200).json({ // give the client a response
                'image-id': uuid
            });
        });
    });
});

app.get('/image/embed', (req, res) => {
    let uuid = '';
    if (!req.query['image-id'] || typeof req.query['image-id'] !== 'string') {
        return errorResponse(new ValidationError('image-id'), req, res);
    }
    uuid = req.query['image-id'];

    fs.readFile('data/image-db.json', (err, data) => {
        if (err) return errorResponse(err, req, res);
        let imagesDb = JSON.parse(data);
        if (!imagesDb[uuid]) {
            return errorResponse(new NotFoundError('img'), req, res);
        }
        if (imagesDb[uuid]['view-pass'] === '') {
            let path = `uploads/${imagesDb[uuid]['uri']}`;
            res.status(200);
            res.contentType(mime.contentType(path));
            fs.createReadStream(path).pipe(res);
        } else {
            if (!req.query['view-pass'] || req.query['view-pass'] !== imagesDb[uuid]['view-pass']) {
                return errorResponse(new ValidationError('view-pass'), req, res);
            } else {
                let path = `uploads/${imagesDb[uuid]['uri']}`;
                res.status(200);
                res.contentType(mime.contentType(imagesDb[uuid]['uri']));
                fs.createReadStream(path).pipe(res);
            }
        }
    });
});

/* error handling */
app.use((err, req, res) => {
    errorResponse(err, req, res);
});

app.listen(port, host, () => {
    console.log(`Listening to ${host}:${port}`);
});
