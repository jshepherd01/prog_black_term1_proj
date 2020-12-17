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
class UserError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'UserError';
        this.status = details['status'];
        this.details = details;
    }
}

const errorResponse = (err, req, res, restype) => {
    /* Handles error responses to every call */
    if (err.name === 'UserError') {
        // if it's an error that this script generated
        res.status(err.status);
        res.contentType(mime.contentType(restype)); // send the appropriate headers
        switch (restype) { // send a body depending on the mimetype the user will be expecting
            case '.png': // images
                fs.createReadStream(`error/image/${err.status}.png`).pipe(res);
                break;

            case '.json': // json data
                res.json(err.details);
                break;

            default: // default to plaintext
                // this should never actually happen but it helps to be prepared
                res.send('There was a problem with your request.');
                break;
        }
    } else {
        res.status(500); // if it's some other error, just give a generic 500
        res.contentType(mime.contentType(restype));
        switch (restype) {
            case '.png':
                fs.createReadStream('error/image/500.png').pipe(res);
                break;
            
            case '.json':
                res.json({'status': 500});
                break;
        
            default:
                res.send('The server encountered an error while processing your request.\nPlease try again later.\n');
                break;
        }
    }
};

const uploadStorage = multer.diskStorage({
    /* decides on a destination and a file name for uploaded images */
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // generate a universally unique identifier for the image
        let uid = uuidv4();
        let ext = mime.extension(file.mimetype); // get the appropriate file extension
        cb(null, `${uid}.${ext}`);
    }
});

const uploadFilter = (req, file, cb) => {
    /* decides whether or not to process an uploaded file */
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // if it's an image, process it
    } else {
        cb(null, false); // otherwise, don't. The post callback will send the error to the user
    }
};

const upload = multer({
    storage: uploadStorage,
    fileFilter: uploadFilter
});

const app = express(http.createServer());

app.use(express.static('static/'));

app.post('/image/upload', upload.single('file'), (req, res) => {
    /* upload an image to the server */

    let newEntry = {};
    let uuid = '';
    let invalid = [];
    
    /* validate request */
    if (!req.file) { // request must include a file
        invalid.push('file');
    } else {
        uuid = req.file.filename.split('.')[0];
        newEntry['uri'] = req.file.filename;
    }

    if (!req.body['title'] || typeof req.body['title'] !== 'string') { // request must include a title
        invalid.push('title');
    } else {
        newEntry['title'] = req.body['title'];
    }

    if (req.body['view-pass']) {
        if (typeof req.body['view-pass'] === 'string') { // if the view-pass is set, it must be a string
            newEntry['view-pass'] = req.body['view-pass'];
        } else {
            invalid.push('view-pass');
        }
    } else {
        newEntry['view-pass'] = ''; // if no view-pass is set, use default value
    }

    if (!req.body['edit-pass'] || typeof req.body['edit-pass'] !== 'string') { // request must include an edit passcode
        invalid.push('edit-pass');
    } else {
        newEntry['edit-pass'] = req.body['edit-pass'];
    }

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
                invalid.push('nsfw'); // if it's neither, it's invalid
            }                         // (is this how terfs think?)
        } else {
            invalid.push('nsfw'); // if it's a weird data type like a number or something, also error
        }
    } else {
        newEntry['nsfw'] = false; // if it's not set at all, default to false
    }

    if (req.body['author']) {
        if (typeof req.body['author'] === 'string') { // author is another optional string
            newEntry['author'] = req.body['author'];
        } else {
            invalid.push('author');
        }
    } else {
        newEntry['author'] = ''; // default value
    }

    if (req.body['copyright']) {
        if (typeof req.body['copyright'] === 'string') { // same again for copyright
            newEntry['copyright'] = req.body['copyright'];
        } else {
            invalid.push('copyright');
        }
    } else {
        newEntry['copyright'] = '';
    }

    /* defaults for the rest */
    newEntry['alt-text'] = '';
    newEntry['origin-ip'] = req.ip;
    newEntry['timestamp'] = Date.now();

    /* if anything's not valid, make an error happen */
    if (invalid.length > 0) {
        return errorResponse(
            new UserError(
                'At least one input was invalid',
                {
                    'status': 400, // I know this is a repeat of the status code
                    'invalid': invalid // but it makes it much easier to parse on the front end
                }
            ), req, res, '.json'
        );
    }

    /* process request */
    fs.readFile('data/image-db.json', (err, data) => { // read the json into memory
        // terrible way of doing it but I don't have a realy databse so :\
        if (err) return errorResponse(err, req, res, '.json'); // throw the error, if one is encountered. Client will see it as a 500.
        let imagesDb = JSON.parse(data); // parse JSON
        imagesDb[uuid] = newEntry; // add the new thing
        fs.writeFile('data/image-db.json', JSON.stringify(imagesDb), (err) => { // write the JSON back to file
            if (err) return errorResponse(err, req, res, '.json'); // keep throwing any and all errors
            res.status(200).json({ // give the client a response
                'status': 200,
                'image-id': uuid
            });
        });
    });
});

app.get('/image/get', (req, res) => {
    let uuid = '';
    if (!req.query['id'] || typeof req.query['id'] !== 'string') {
        return errorResponse(
            new UserError(
                'At least one input was invalid',
                {
                    'status': 400,
                    'invalid': ['id']
                }
            ), req, res, '.png'
        );
    }
    uuid = req.query['id'];

    fs.readFile('data/image-db.json', (err, data) => {
        if (err) return errorResponse(err, req, res);
        let imagesDb = JSON.parse(data);
        if (!imagesDb[uuid]) {
            return errorResponse(
                new UserError(
                    'Image ID was not found',
                    {'status': 404}
                ), req, res, '.json'
            );
        }
        if (imagesDb[uuid]['view-pass'] === '') {
            res.status(200).json({
                'status': 200,
                'priv': false,
                'author': imagesDb[uuid]['author'],
                'copyright': imagesDb[uuid]['copyright'],
                'nsfw': imagesDb[uuid]['nsfw']
            });
        } else {
            if (!req.query['view-pass']) {
                return errorResponse(
                    new UserError(
                        'Image is private, no passcode sent',
                        {'status': 401}
                    ), req, res, '.json'
                );
            } else if (req.query['view-pass'] !== imagesDb[uuid]['view-pass']) {
                return errorResponse(
                    new UserError(
                        'Incorrect passcode',
                        {'status': 403}
                    ), req, res, '.json'
                );
            } else {
                res.status(200).json({
                    'status': 200,
                    'priv': true,
                    'author': imagesDb[uuid]['author'],
                    'copyright': imagesDb[uuid]['copyright'],
                    'nsfw': imagesDb[uuid]['nsfw']
                });
            }
        }
    });
});

app.get('/image/embed', (req, res) => {
    let uuid = '';
    if (!req.query['id'] || typeof req.query['id'] !== 'string') {
        return errorResponse(
            new UserError(
                'At least one input was invalid',
                {
                    'status': 400,
                    'invalid': ['id']
                }
            ), req, res, '.png'
        );
    }
    uuid = req.query['id'];

    fs.readFile('data/image-db.json', (err, data) => {
        if (err) return errorResponse(err, req, res);
        let imagesDb = JSON.parse(data);
        if (!imagesDb[uuid]) {
            return errorResponse(
                new UserError(
                    'Image ID was not found',
                    {'status': 404}
                ), req, res, '.png'
            );
        }
        if (imagesDb[uuid]['view-pass'] === '') {
            let path = `uploads/${imagesDb[uuid]['uri']}`;
            res.status(200);
            res.contentType(mime.contentType(path));
            fs.createReadStream(path).pipe(res);
        } else {
            if (!req.query['view-pass']) {
                return errorResponse(
                    new UserError(
                        'Image is private, no passcode sent',
                        {'status': 401}
                    ), req, res, '.png'
                );
            } else if (req.query['view-pass'] !== imagesDb[uuid]['view-pass']) {
                return errorResponse(
                    new UserError(
                        'Incorrect passcode',
                        {'status': 403}
                    ), req, res, '.png'
                );
            } else {
                let path = `uploads/${imagesDb[uuid]['uri']}`;
                res.status(200);
                res.contentType(mime.contentType(imagesDb[uuid]['uri']));
                fs.createReadStream(path).pipe(res);
            }
        }
    });
});

app.get('*', (req, res) => {
    res.status(501).send('That functionality is not implemented');
});

app.listen(port, host, () => {
    console.log(`Listening to ${host}:${port}`);
});
