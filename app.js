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
const dbCommentPath = 'data/comment-db.json';

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
    /* Handles error responses to every call
    err: the error to handle
    req: the request object to respond to
    res: the response object to write to
    restype: a file extension-like string indicating the mimetype of the response */

    let status = err.name === 'UserError' ? err.status : 500;
    let details = err.name === 'UserError' ? err.details : {'status': 500};

    if (req.file) fs.unlink(req.file.path, nop);

    res.status(status);
    res.contentType(mime.contentType(restype));
    switch (restype) {
        case '.png':
            fs.createReadStream(`error/image/${status}.png`).pipe(res);
            break;

        case '.json':
            res.json(details);
            break;
        
        case '.html':
            fs.createReadStream(`error/${status}.html`).pipe(res);
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
        /* each image is assigned a uuid, and given an appropriate extension */
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
const validate = (body, rules, file=null, defaults={}) => {
    /* validate a request body according to some rules
    body: the body object to validate
    rules: the rules to validate the object against, as field: [type, 'optional']
    file (optional): a file object to validate
    defaults (optional): required if any fields are optional, object of default values by type
    return: a promise object that resolves if the body and file are valid and rejects otherwise
        passes the validated body object to resolve() */

    return new Promise((resolve, reject) => {
        let newEntry = {};
        let invalid = [];
        if ('file' in rules) {
            /* validation on the file */
            if (file && file.size > 0) {
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
            return reject(new UserError(
                'No input was sent',
                {
                    'status': 400,
                    'invalid': invalid
                }
            ));
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
            return reject(new UserError(
                'At least one input was invalid',
                {
                    'status': 400,
                    'invalid': invalid
                }
            ));
        } else {
            return resolve(newEntry);
        }
    });
};

/*
    database actions (heh, "database", lol)
*/
const getItemByID = (dbPath, uuid) => {
    /* get the item at uuid from the json file at dbPath
    dbPath: the path to the database file, preferably from a global const
    uuid: the ID of the item to retrieve
    return: a promise object that resolves if the item is found, and rejects otherwise,
        passes the retrieved item to resolve() */

    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            try {
                let jsonData = JSON.parse(data);
                if (uuid in jsonData) return resolve(jsonData[uuid]);
                return reject(new UserError(
                    'UUID not found',
                    {'status': 404}
                ));
            } catch (err) {
                return reject(err);
            }
        });
    });
};

const getItemsByField = (dbPath, params) => {
    /* get all items from the file at dbPath that match params
    dbPath: the path to the databse file
    params: an object of field: value, where value can be either a literal or a regex, to match against
    returns a promise object that resolves when no errors are encountered,
        passes an object to resolve() that is a subset of the database which matches params */

    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            try {
                let jsonData = JSON.parse(data);
                let matches = {};
                /* iterate over the database, then the parameters */
                for (let [dataKey, dataVal] of Object.entries(jsonData)) {
                    let match = true;
                    for (let [paramKey, paramVal] of Object.entries(params)) {
                        if (!(paramKey in dataVal)) {
                            /* first time datum fails a parameter, move onto the next one */
                            match = false;
                            break;
                        } else if (paramVal instanceof RegExp) {
                            if (!paramVal.test(dataVal[paramKey])) {
                                match = false;
                                break;
                            }
                        } else if (dataVal[paramKey] !== paramVal) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        matches[dataKey] = dataVal;
                    }
                }
                return resolve(matches);
            } catch (err) {
                return reject(err);
            }
        });
    });
};

const createRecord = (dbPath, uuid, record) => {
    /* insert record into the json file at dbPath at the key uuid
    dbPath: the path to the database file
    uuid: the ID to create the record at
    record: the record to insert into the databse
    returns: a promise object that resolves if the record was inserted successfully */
    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            try {
                let jsonData = JSON.parse(data);
                if (uuid in jsonData) return reject(new UserError('UUID is already present', {'status': 500}));
                jsonData[uuid] = record;
                fs.writeFile(dbPath, JSON.stringify(jsonData), (err) => {
                    if (err) return reject(err);
                    return resolve();
                });
            } catch (err) {
                return reject(err);
            }
        });
    });
};

const updateRecord = (dbPath, uuid, changes) => {
    /* change the record at uuid to match the new values in changes
    dbPath: the path to the database file
    uuid: the ID of the record to update
    changes: an object containing the changes to be made to the record, as key: new value
    returns a promise object that resolves if the record was updated successfully */

    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            try {
                let jsonData = JSON.parse(data);
                if (!(uuid in jsonData)) return reject(new UserError('UUID not found', {'status': 404}));
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
            } catch (err) {
                return reject();
            }
        });
    });
};

const deleteRecord = (dbPath, uuid, recursive=true) => {
    /* completely remove the record at uuid, if recursive also delete records referencing it
    dbPath: the path to the database
    uuid: the ID of the record to delete
    recursive (optional): whether or not to also delete records referencing the deleted record
    returns: a promise object that resolves if the record was successfully deleted
        recursive deletes do not affect whether the promise resolves */

    return new Promise((resolve, reject) => {
        fs.readFile(dbPath, (err, data) => {
            if (err) return reject(err);
            try {
                let jsonData = JSON.parse(data);
                if (!(uuid in jsonData)) return reject(new UserError('UUID not found', {'status': 404}));
                if (!(delete jsonData[uuid])) return reject(new Error('Could not delete record'));
                fs.writeFile(dbPath, JSON.stringify(jsonData), (err) => {
                    if (err) return reject(err);
                    resolve();
                    /* if the next part fails, it doesn't make much difference to the user */
                    if (recursive) {
                        switch (dbPath) {
                            case dbImagePath:
                                getItemsByField(dbCommentPath, {'image-id': uuid}).then(data => {
                                    let idList = Object.keys(data);
                                    let delNext = (index) => {
                                        if (index === idList.length) return;
                                        deleteRecord(dbCommentPath, idList[index]).then(() => {
                                            delNext(index+1);
                                        });
                                    };
                                    delNext(0);
                                });
                                break;
                        }
                    }
                });
            } catch (err) {
                return reject(err);
            }
        });
    });
};

/*
    data handling
*/
const sortByTimestamp = (unsortedArray) => {
    /* sorts an array of objects by their timestamps, in ascending order, in-place
    unsortedArray: the array to sort */

    unsortedArray.sort((a,b) => {
        return a['timestamp'] - b['timestamp'];
    });
};

/*
    server init
*/
const app = express(http.createServer());
app.use(express.static('static/'));

/*
    === image actions ===
*/
app.post('/image/upload', upload.single('file'), (req, res) => {
    /* upload an image to the server */

    let newEntry, uuid, valResult;

    validate(req.body, {
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
    }).then(ret => {
        valResult = ret;

        newEntry = valResult;
        newEntry['alt-text'] = '';
        newEntry['origin-ip'] = req.ip;
        newEntry['timestamp'] = Date.now();
        uuid = newEntry['uri'].split('.')[0];

        return createRecord(dbImagePath, uuid, newEntry);
        
    }).then(() => {
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

    let valResult;

    validate(req.query, {
        'id': ['string'],
        'view-pass': ['string', 'optional']
    }, null, {'string': ''}).then(ret => {
        valResult = ret;

        return getItemByID(dbImagePath, valResult['id']);

    }).then(data => {
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
            'nsfw': data['nsfw'],
            'timestamp': data['timestamp']
        });

    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.get('/image/embed', (req, res) => {
    /* get an image from the server */

    let valResult;

    validate(req.query, {
        'id': ['string'],
        'view-pass': ['string', 'optional']
    }, null, {'string': ''}).then(ret => {
        valResult = ret;

        return getItemByID(dbImagePath, valResult['id']);

    }).then(data => {
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

app.get('/image/list', (req, res) => {
    /* list all non-private images */
    /* filters out nsfw by default. Include ?nsfw parameter to include nsfw results
    and ?nsfw=true to remove sfw results */

    let valResult;
    let params = {'view-pass': /^$/};
    let imagesList = [];

    validate(req.query, {
        'nsfw': ['boolean', 'optional']
    }, null, {'boolean': null}).then(ret => {
        valResult = ret;

        switch (valResult['nsfw']) {
            case true:
                params['nsfw'] = true;
                break;
            
            case null:
                params['nsfw'] = false;
                break;
        }

        return getItemsByField(dbImagePath, params);

    }).then(data => {
        for (let [key, value] of Object.entries(data)) {
            let thisImage = {};
            thisImage['id'] = key;
            thisImage['title'] = value['title'];
            thisImage['author'] = value['author'];
            thisImage['copyright'] = value['copyright'];
            thisImage['nsfw'] = value['nsfw'];
            thisImage['timestamp'] = value['timestamp'];
            imagesList.push(thisImage);
        }
        sortByTimestamp(imagesList);
        res.status(200).json({
            'status': 200,
            'images': imagesList
        });

    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.post('/image/verify', upload.none(), (req, res) => {
    /* verify that an image's edit passcode is correct */

    let valResult;

    validate(req.body, {
        'id': ['string'],
        'edit-pass': ['string']
    }, null, {}).then(ret => {
        valResult = ret;

        return getItemByID(dbImagePath, valResult['id']);

    }).then(data => {
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

    let newUri, oldPath, tempPath, newPath, valResult;
    let changes = {};
    
    validate(req.body, {
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
    }).then(ret => {
        valResult = ret;

        return getItemByID(dbImagePath, valResult['id']);

    }).then(data => {
        if (valResult['edit-pass'] !== data['edit-pass']) {
            throw new UserError('Incorrect passcode', {'status': 403});
        }

        if (valResult['uri'] !== null) {
            newUri = `${valResult['id']}.${valResult['uri'].split('.')[1]}`;
            if (data['uri'] !== 'removed.png') oldPath = `uploads/${data['uri']}`;
            tempPath = `uploads/temp/${valResult['uri']}`;
            newPath = `uploads/${newUri}`;
            changes['uri'] = newUri;
            changes['timestamp'] = Date.now();
        }
        if (valResult['title'] !== null) changes['title'] = valResult['title'];
        if (valResult['view-pass'] !== null) changes['view-pass'] = valResult['view-pass'];
        if (valResult['author'] !== null) changes['author'] = valResult['author'];
        if (valResult['copyright'] !== null) changes['copyright'] = valResult['copyright'];
        if (valResult['nsfw'] !== null) changes['nsfw'] = valResult['nsfw'];

        return updateRecord(dbImagePath, valResult['id'], changes);

    }).then(() => {
        if ('uri' in changes) {
            if (oldPath !== undefined) {
                fs.unlink(oldPath, () => fs.rename(tempPath, newPath, nop));
            } else {
                fs.rename(tempPath, newPath, nop);
            }
        }
        res.status(200).json({'status': 200});

    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.post('/image/delete', upload.none(), (req, res) => {
    /* removes an image and all of its metadata */

    let imagePath, valResult;

    validate(req.body, {
        'id': ['string'],
        'edit-pass': ['string']
    }, null, {}).then(ret => {
        valResult = ret;

        return getItemByID(dbImagePath, valResult['id']);

    }).then(data => {
        if (valResult['edit-pass'] !== data['edit-pass']) {
            throw new UserError('Incorrect passcode', {'status': 403});
        }

        if (data['uri'] !== 'removed.png') imagePath = `uploads/${data['uri']}`;

        return deleteRecord(dbImagePath, valResult['id']);

    }).then(() => {
        if (imagePath !== undefined) fs.unlink(imagePath, nop);
        res.status(200).json({'status': 200});

    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

/*
    === comment actions ===
*/
app.post('/comment/upload', upload.none(), (req, res) => {
    /* adds a comment to an image */

    let newUUID, valResult;
    let newEntry = {};

    validate(req.body, {
        'id': ['string'],
        'view-pass': ['string', 'optional'],
        'display-name': ['string', 'optional'],
        'text': ['string']
    }, null, {'string': ''}).then(ret => {
        valResult = ret;

        return getItemByID(dbImagePath, valResult['id']);

    }).then(data => {
        if (data['view-pass'] !== '') {
            if (valResult['view-pass'] === '') {
                throw new UserError('Image is private, no passcode sent', {'status': 401});
            } else if (valResult['view-pass'] !== data['view-pass']) {
                throw new UserError('Incorrect passcode', {'status': 403});
            }
        }
        newUUID = uuidv4();
        newEntry['image-id'] = valResult['id'];
        newEntry['display-name'] = valResult['display-name'] || 'Anonymous';
        newEntry['text'] = valResult['text'];
        newEntry['origin-ip'] = req.ip;
        newEntry['timestamp'] = Date.now();

        return createRecord(dbCommentPath, newUUID, newEntry);

    }).then(() => {
        res.status(200).json({
            'status': 200,
            'id': newUUID
        });

    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.get('/comment/list', (req, res) => {
    /* returns a list of comments associated with an image */

    let valResult;
    let commentsList = [];

    validate(req.query, {
        'id': ['string'],
        'view-pass': ['string', 'optional']
    }, null, {'string': ''}).then(ret => {
        valResult = ret;

        return getItemByID(dbImagePath, valResult['id']);
    }).then(data => {
        if (data['view-pass'] !== '') {
            if (valResult['view-pass'] === '') {
                throw new UserError('Image is private, no passcode sent', {'status': 401});
            } else if (valResult['view-pass'] !== data['view-pass']) {
                throw new UserError('Incorrect passcode', {'status': 403});
            }
        }
        
        return getItemsByField(dbCommentPath, {'image-id': valResult['id']});

    }).then(data => {
        for (let [key, value] of Object.entries(data)) {
            let thisComment = {};
            thisComment['id'] = key;
            thisComment['display-name'] = value['display-name'];
            thisComment['text'] = value['text'];
            thisComment['timestamp'] = value['timestamp'];
            commentsList.push(thisComment);
        }
        sortByTimestamp(commentsList);

        res.status(200).json({
            'status': 200,
            'comments': commentsList
        });

    }).catch(err => {
        errorResponse(err, req, res, '.json');
    });
});

app.get('/comment/get', (req, res) => {
    /* returns a comment by its ID */

    let valResult, commentData;

    validate(req.query, {
        'id': ['string'],
        'view-pass': ['string', 'optional']
    }, null, {'string': ''}).then(ret => {
        valResult = ret;

        return getItemByID(dbCommentPath, valResult['id']);
    }).then(data => {
        commentData = data;

        return getItemByID(dbImagePath, commentData['image-id']);
    }).then(data => {
        if (data['view-pass'] !== '') {
            if (valResult['view-pass'] === '') {
                throw new UserError('Image is private, no passcode sent', {'status': 401});
            } else if (valResult['view-pass'] !== data['view-pass']) {
                throw new UserError('Incorrect passcode', {'status': 403});
            }
        }

        res.status(200).json({
            'status': 200,
            'image-id': commentData['image-id'],
            'display-name': commentData['display-name'],
            'text': commentData['text'],
            'timestamp': commentData['timestamp']
        });
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