/* eslint-disable */
'use strict';

const request = require('supertest');
const app = require('./app');
const fs = require('fs');

let originalFilesList;

beforeAll(() => {
    // store original state
    fs.copyFileSync('data/comment-db.json','temp/comment-db.json');
    fs.copyFileSync('data/image-db.json','temp/image-db.json');
    originalFilesList = fs.readdirSync('uploads');

    // place test data
    fs.copyFileSync('test_data/comment-db.json','data/comment-db.json');
    fs.copyFileSync('test_data/image-db.json','data/image-db.json');
    fs.copyFileSync('test_data/8d5d083e-2180-49bd-bd91-ae9931b49f09.gif','uploads/8d5d083e-2180-49bd-bd91-ae9931b49f09.gif');
    fs.copyFileSync('test_data/c1388249-fb15-4e29-9c8e-f2013c226ee4.jpeg','uploads/c1388249-fb15-4e29-9c8e-f2013c226ee4.jpeg');
    fs.copyFileSync('test_data/d46c8501-09d4-42a7-b87b-06d3fd89fffa.png','uploads/d46c8501-09d4-42a7-b87b-06d3fd89fffa.png');
    fs.copyFileSync('test_data/a437764d-5af1-4beb-836e-9fa986fc1b10.bmp','uploads/a437764d-5af1-4beb-836e-9fa986fc1b10.bmp');
});

afterAll(() => {
    // restore original state
    fs.copyFileSync('temp/comment-db.json','data/comment-db.json');
    fs.copyFileSync('temp/image-db.json','data/image-db.json');
    fs.readdirSync('uploads').forEach((file) => {
        if (!originalFilesList.includes(file)) {
            fs.unlinkSync('uploads/'+file);
        }
    });
});

describe('Test /image/get', () => {
    test('Fails with no data', () => {
        return request(app)
            .get('/image/get')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with empty id', () => {
        return request(app)
            .get('/image/get?id')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails on not-found id', () => {
        return request(app)
            .get('/image/get?id=af2fd9ea-159f-409c-a991-9db3c63320ee')
            .expect(404)
            .expect('Content-type', /json/)
            .expect(/404/);
    });

    test('Succeeds on public image', () => {
        return request(app)
            .get('/image/get?id=d46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/\$TEST\$ PUBLIC SFW/);
    });

    test('Fails with no view-pass on private image', () => {
        return request(app)
            .get('/image/get?id=a437764d-5af1-4beb-836e-9fa986fc1b10')
            .expect(401)
            .expect('Content-type',/json/)
            .expect(/401/);
    });

    test('Fails with empty view-pass on private image', () => {
        return request(app)
            .get('/image/get?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass')
            .expect(401)
            .expect('Content-type',/json/)
            .expect(/401/);
    });

    test('Fails with wrong view-pass on private image', () => {
        return request(app)
            .get('/image/get?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass=DyXWO8O5AJHl6Ff5aZC3uwWD')
            .expect(403)
            .expect('Content-type',/json/)
            .expect(/403/);
    });

    test('Succeeds on private image', () => {
        return request(app)
            .get('/image/get?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass=qMQWogL2jSbDHB0hW5uMwZsR')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/\$TEST\$ PRIVATE SFW/);
    });
});

describe('Test /image/upload', () => {
    test('Fails with no data', () => {
        return request(app)
            .post('/image/upload')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with no title', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('edit-pass','ValidEditPass')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/title/);
    });

    test('Fails with empty title', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','')
            .field('edit-pass','ValidEditPass')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/title/);
    })

    test('Fails with no file', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/file/);
    });

    test('Fails with wrong file type', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .attach('file',fs.readFileSync('test_data/invalid.txt'),'invalid.txt')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/file/);
    });

    test('Fails with string as file', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('file','invalid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/file/);
    });

    test('Fails with empty file', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .attach('file',fs.readFileSync('test_data/invalid.jpg'),'invalid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/file/);
    });

    test('Fails with no edit-pass', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Fails with empty edit-pass', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Succeeds with no optionals', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Succeeds with view-pass', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('view-pass','ValidViewPass')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails with invalid NSFW flag', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('nsfw','banana')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/nsfw/);
    });

    test('Succeeds with nsfw true', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('nsfw','true')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Succeeds with nsfw false', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('nsfw','false')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Succeeds with author', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('author','Valid McAuthorson')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Succeeds with copyright', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('copyright','Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit.')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Succeeds with all optionals', () => {
        return request(app)
            .post('/image/upload')
            .set('content-type','multipart/form-data')
            .field('title','Valid Title')
            .field('edit-pass','ValidEditPass')
            .field('view-pass','ValidViewPass')
            .field('nsfw','true')
            .field('author','Valid McAuthorson')
            .field('copyright','Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit.')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/);
    });
});
