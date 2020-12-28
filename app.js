/*
    package imports
*/
const http = require('http');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
const mime = require('mime-types');

/*
    globals
*/
const dbImagePath = 'data/image-db.json';

/* no operation */
const nop = () => {};

/*
    error handling
*/
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

    let status = 500;
    let details = {'status': 500};
    if (err.name === 'UserError') {
        status = err.status;
        details = err.details;
    }

    if (req.file) fs.unlink(req.file.path, nop);
    res.status(status);
    res.contentType(mime.contentType(restype));
    switch (restype) {
        /* body depending on expected mime type */
        case '.png':
            fs.createReadStream(`error/image/${status}.png`).pipe(res);
            break;

        case '.json':
            res.json(details);
            break;

        default:
            /* default to plaintext */
            res.send('The server encountered an error while processing your request.\nPlease try again later.\n');
            break;
    }
};

/*
    upload handling
*/
const uploadStorage = multer.diskStorage({
    /* decides on a destination and a file name for uploaded images */
    destination: (req, file, cb) => {
        /* images are provisionally uploaded to temp, and moved or deleted depending on validation */
        cb(null, 'uploads/temp/');
    },
    filename: (req, file, cb) => {
        let uid = uuidv4();
        let ext = mime.extension(file.mimetype);
        cb(null, `${uid}.${ext}`);
    }
});

const upload = multer({
    storage: uploadStorage
});

/*
    validation
*/
const validate = (body, rules, file, defaults) => {
    /* validate a request body according to some rules, returning either a validated object or an error */

    let newEntry = {};
    let invalid = [];
    if ('file' in rules) {
        if (file) {
            if (rules['file'].includes(file.mimetype.split('/')[0])) {
                newEntry['uri'] = file.filename;
            } else {
                invalid.push('file');
            }
        } else if (rules['file'].includes('optional')) {
            newEntry['uri'] = defaults['file'];
        } else {
            invalid.push('file');
        }
    }
    if (!body) {
        /* check for an empty body */
        for (let [key, value] of Object.entries(rules)) {
            if (!('optional' in value) && key !== 'file') {
                invalid.push(key);
            }
        }
        return new UserError(
            'No input was sent',
            {
                'status': 400,
                'invalid': invalid
            }
        );
    }
    for (let [key, value] of Object.entries(rules)) {
        /* check the body for each rule */
        if (key === 'file') continue;
        if (key in body) {
            if (body[key] !== '') {
                if (typeof body[key] !== 'string') {
                    invalid.push(key);

                } else if (value.includes('string')) {
                    newEntry[key] = body[key];

                } else if (value.includes('boolean')) {
                    if (body[key] === 'true') {
                        newEntry[key] = true;
                    } else if (body[key] === 'false') {
                        newEntry[key] = false;
                    } else {
                        invalid.push(key);
                    }

                } else {
                    throw new Error(`data type ${value} not implemented for ${key}`);
                }

            } else if (value.includes('optional')) {
                newEntry[key] = (value.includes('string')) ? body[key] : false;
            } else {
                invalid.push(key);
            }

        } else if (value.includes('optional')) {
            newEntry[key] = (value.includes('string')) ? defaults['string'] : defaults['boolean'];
        } else {
            invalid.push(key);
        }
    }
    if (invalid.length > 0) {
        return new UserError(
            'At least one input was invalid',
            {
                'status': 400,
                'invalid': invalid
            }
        );
    } else {
        return newEntry;
    }
};

/*
    database actions (heh, "database", lol)
*/
const getItemByID = (dbPath, uuid) => {
    /* get the item at uuid from the json file at dbPath */

    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            let jsonData = JSON.parse(data);
            if (uuid in jsonData) return resolve(jsonData[uuid]);
            return reject(new UserError(
                'UUID not found',
                {'status': 404}
            ));
        });
    });
};

const createRecord = (dbPath, uuid, record) => {
    /* insert record into the json file at dbPath at the key uuid */
    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            let jsonData = JSON.parse(data);
            if (uuid in jsonData) return reject(new UserError('UUID is already present', {'status': 500}));
            jsonData[uuid] = record;
            fs.writeFile(dbPath, JSON.stringify(jsonData), (err) => {
                if (err) return reject(err);
                return resolve();
            });
        });
    });
};

const updateRecord = (dbPath, uuid, changes) => {
    /* change the record at uuid to match the new values in changes */

    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            let jsonData = JSON.parse(data);
            if (!(uuid in jsonData)) return reject(new UserError('UUID not found', {'status': 500}));
            let updatedRecord = jsonData[uuid];
            for (let [key, value] of Object.entries(changes)) {
                if (key in updatedRecord) {
                    updatedRecord[key] = value;
                } else {
                    return reject(new Error(`No ${key} item in record`));
                }
            }
            jsonData[uuid] = updatedRecord;
            fs.writeFile(dbPath, JSON.stringify(jsonData), (err) => {
                if (err) return reject(err);
                return resolve();
            });
        });
    });
};

/*
    server init
*/
const app = express(http.createServer());
app.use(express.static('static/'));

/*
    image actions
*/
app.post('/image/upload', upload.single('file'), (req, res) => {
    /* upload an image to the server */

    let newEntry, uuid;
    
    /* validate */
    let valResult = validate(req.body, {
        'title': ['string'],
        'edit-pass': ['string'],
        'view-pass': ['string', 'optional'],
        'nsfw': ['boolean', 'optional'],
        'author': ['string', 'optional'],
        'copyright': ['string', 'optional'],
        'file': ['image']
    }, req.file, {
        'string': '',
        'boolean': false,
    });

    if (valResult instanceof UserError) return errorResponse(valResult, req, res, '.json');

    newEntry = valResult;
    newEntry['alt-text'] = '';
    newEntry['origin-ip'] = req.ip;
    newEntry['timestamp'] = Date.now();
    uuid = newEntry['uri'].split('.')[0];

    /* process request */
    createRecord(dbImagePath, uuid, newEntry).then(() => {
        fs.rename(req.file.path, `uploads/${req.file.filename}`, nop);
        res.status(200).json({
            'status': 200,
            'id': uuid
        });
    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.get('/image/get', (req, res) => {
    /* get the details of an image from the server */

    /* validate */
    let valResult = validate(req.query, {
        'id': ['string'],
        'view-pass': ['string', 'optional']
    }, null, {'string': ''});

    if (valResult instanceof UserError) return errorResponse(valResult, req, res, '.json');

    /* process request */
    getItemByID(dbImagePath, valResult['id']).then(data => {
        if (data['view-pass'] !== '') {
            if (valResult['view-pass'] === '') {
                throw new UserError('Image is private, no passcode sent', {'status': 401});
            } else if (valResult['view-pass'] !== data['view-pass']) {
                throw new UserError('Incorrect passcode', {'status': 403});
            }
        }
        res.status(200).json({
            'status': 200,
            'title': data['title'],
            'priv': (data['view-pass'] !== ''),
            'author': data['author'],
            'copyright': data['copyright'],
            'nsfw': data['nsfw']
        });
    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.get('/image/embed', (req, res) => {
    /* get an image from the server */

    /* validate */
    let valResult = validate(req.query, {
        'id': ['string'],
        'view-pass': ['string', 'optional']
    }, null, {'string': ''});

    if (valResult instanceof UserError) return errorResponse(valResult, req, res, '.png');

    /* process request */
    getItemByID(dbImagePath, valResult['id']).then(data => {
        if (data['view-pass'] !== '') {
            if (valResult['view-pass'] === '') {
                throw new UserError('Image is private, no passcode sent', {'status': 401});
            } else if (valResult['view-pass'] !== data['view-pass']) {
                throw new UserError('Incorrect passcode', {'status': 403});
            }
        }
        res.status(200);
        res.contentType(mime.contentType(data['uri']));
        fs.createReadStream(`uploads/${data['uri']}`).pipe(res);
    }).catch(err => {
        errorResponse(err, req, res, '.png');
    });
});

app.post('/image/verify', upload.none(), (req, res) => {
    /* verify that an image's edit passcode is correct */

    /* validate */
    let valResult = validate(req.body, {
        'id': ['string'],
        'edit-pass': ['string']
    }, null, {});

    if (valResult instanceof UserError) return errorResponse(valResult, req, res, '.json');

    /* process request */
    getItemByID(dbImagePath, valResult['id']).then(data => {
        if (valResult['edit-pass'] !== data['edit-pass']) {
            throw new UserError('Incorrect passcode', {'status': 403});
        }
        res.status(200).json({'status': 200});
    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.post('/image/update', upload.single('file'), (req, res) => {
    /* changes an image and/or its metadata */

    let newUri, oldPath, tempPath, newPath;
    let changes = {};

    /* validate */
    let valResult = validate(req.body, {
        'id': ['string'],
        'edit-pass': ['string'],
        'title': ['string', 'optional'],
        'file': ['image', 'optional'],
        'view-pass': ['string', 'optional'],
        'author': ['string', 'optional'],
        'copyright': ['string', 'optional'],
        'nsfw': ['boolean', 'optional']
    }, req.file, {
        'string': null,
        'boolean': null,
        'file': null
    });

    if (valResult instanceof UserError) return errorResponse(valResult, req, res, '.json');

    /* process request */
    getItemByID(dbImagePath, valResult['id']).then(data => {
        if (valResult['edit-pass'] !== data['edit-pass']) {
            throw new UserError('Incorrect passcode', {'status': 403});
        }

        if (valResult['uri'] !== null) {
            newUri = `${valResult['id']}.${valResult['uri'].split('.')[1]}`;
            oldPath = `uploads/${data['uri']}`;
            tempPath = `uploads/temp/${valResult['uri']}`;
            newPath = `uploads/${newUri}`;
            changes['uri'] = newUri;
        }
        if (valResult['title'] !== null) changes['title'] = valResult['title'];
        if (valResult['view-pass'] !== null) changes['view-pass'] = valResult['view-pass'];
        if (valResult['author'] !== null) changes['author'] = valResult['author'];
        if (valResult['copyright'] !== null) changes['copyright'] = valResult['copyright'];
        if (valResult['nsfw'] !== null) changes['nsfw'] = valResult['nsfw'];

        return updateRecord(dbImagePath, valResult['id'], changes);

    }).then(() => {
        if ('uri' in changes) fs.unlink(oldPath, () => fs.rename(tempPath, newPath, nop));
        res.status(200).json({'status': 200});

    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.get('*', (req, res) => {
    return errorResponse(
        new UserError(
            'URI not found',
            {'status': 404}
        ), req, res, '.html'
    );
});

app.post('*', (req, res) => {
    return errorResponse(
        new UserError(
            'URI not found',
            {'status': 404}
        ), req, res, '.json'
    );
});

module.exports = app;