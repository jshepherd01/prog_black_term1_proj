/* eslint-disable */
'use strict';

const request = require('supertest');
const app = require('./app');
const fs = require('fs');
const { doesNotMatch } = require('assert');

let originalFilesList;

beforeAll(() => {
    // store original state
    fs.copyFileSync('data/comment-db.json','backup/comment-db.json');
    fs.copyFileSync('data/image-db.json','backup/image-db.json');
    originalFilesList = fs.readdirSync('uploads');

    // place test data
    fs.copyFileSync('test_data/comment-db.json','data/comment-db.json');
    fs.copyFileSync('test_data/image-db.json','data/image-db.json');
    fs.copyFileSync('test_data/8d5d083e-2180-49bd-bd91-ae9931b49f09.gif','uploads/8d5d083e-2180-49bd-bd91-ae9931b49f09.gif');
    fs.copyFileSync('test_data/c1388249-fb15-4e29-9c8e-f2013c226ee4.jpeg','uploads/c1388249-fb15-4e29-9c8e-f2013c226ee4.jpeg');
    fs.copyFileSync('test_data/d46c8501-09d4-42a7-b87b-06d3fd89fffa.png','uploads/d46c8501-09d4-42a7-b87b-06d3fd89fffa.png');
    fs.copyFileSync('test_data/a437764d-5af1-4beb-836e-9fa986fc1b10.bmp','uploads/a437764d-5af1-4beb-836e-9fa986fc1b10.bmp');
    fs.copyFileSync('test_data/1f357f36-6e3f-465c-8633-45e109a1c40f.png','uploads/1f357f36-6e3f-465c-8633-45e109a1c40f.png');
    fs.copyFileSync('test_data/32524b16-2a2a-4819-a835-a6d7d1e85a4f.png','uploads/32524b16-2a2a-4819-a835-a6d7d1e85a4f.png');
    fs.copyFileSync('test_data/8da01847-a996-49f8-96fa-363b1a3bd243.png','uploads/8da01847-a996-49f8-96fa-363b1a3bd243.png');
    fs.copyFileSync('test_data/9f229eeb-1352-494f-8fae-cf13f3cbb457.png','uploads/9f229eeb-1352-494f-8fae-cf13f3cbb457.png');
    fs.copyFileSync('test_data/0189bc8a-5c99-4c84-b567-607ce5d58e19.png','uploads/0189bc8a-5c99-4c84-b567-607ce5d58e19.png');
});

afterAll(() => {
    // restore original state
    fs.copyFileSync('backup/comment-db.json','data/comment-db.json');
    fs.copyFileSync('backup/image-db.json','data/image-db.json');
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

describe('Test /image/list', () => {
    test('No parameters returns correct item', () => {
        return request(app)
            .get('/image/list')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/\$TEST\$ PUBLIC SFW/);
    });

    test('No parameters doesn\'t return private item', () => {
        return request(app)
            .get('/image/list')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/^((?!PRIVATE).)*$/s);
    });

    test('No parameters doesn\'t return nsfw item', () => {
        return request(app)
            .get('/image/list')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/^((?!NSFW).)*$/s);
    });

    test('Fails with junk NSFW', () => {
        return request(app)
            .get('/image/list?nsfw=banana')
            .expect(400)
            .expect('Content-type',/json/)
            .expect(/nsfw/);
    });

    test('Empty NSFW returns correct items', () => {
        return request(app)
            .get('/image/list?nsfw')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/\$TEST\$ PUBLIC SFW/)
            .expect(/\$TEST\$ PUBLIC NSFW/);
    });

    test('Empty NSFW doesn\'t return private item', () => {
        return request(app)
            .get('/image/list?nsfw')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/^((?!PRIVATE).)*$/s);
    });

    test('True NSFW returns correct item', () => {
        return request(app)
            .get('/image/list?nsfw=true')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/\$TEST\$ PUBLIC NSFW/);
    });

    test('True NSFW doesn\'t return private item', () => {
        return request(app)
            .get('/image/list?nsfw=true')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/^((?!PRIVATE).)*$/s);
    });

    test('True NSFW doesn\'t return sfw item', () => {
        return request(app)
            .get('/image/list?nsfw=true')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/^((?! SFW).)*$/s);
    });
});

describe('Test /image/embed', () => {
    test('Fails with no data', () => {
        return request(app)
            .get('/image/embed')
            .expect(400)
            .expect('Content-type', /png/);
    });

    test('Fails with empty id', () => {
        return request(app)
            .get('/image/embed?id')
            .expect(400)
            .expect('Content-type', /png/);
    });

    test('Fails on not-found id', () => {
        return request(app)
            .get('/image/embed?id=af2fd9ea-159f-409c-a991-9db3c63320ee')
            .expect(404)
            .expect('Content-type', /png/);
    });

    test('Succeeds on public image', () => {
        return request(app)
            .get('/image/embed?id=d46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .expect(200)
            .expect('Content-type', /png/);
    });

    test('Fails with no view-pass on private image', () => {
        return request(app)
            .get('/image/embed?id=a437764d-5af1-4beb-836e-9fa986fc1b10')
            .expect(401)
            .expect('Content-type',/png/);
    });

    test('Fails with empty view-pass on private image', () => {
        return request(app)
            .get('/image/embed?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass')
            .expect(401)
            .expect('Content-type',/png/);
    });

    test('Fails with wrong view-pass on private image', () => {
        return request(app)
            .get('/image/embed?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass=DyXWO8O5AJHl6Ff5aZC3uwWD')
            .expect(403)
            .expect('Content-type',/png/);
    });

    test('Succeeds on private image', () => {
        return request(app)
            .get('/image/embed?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass=qMQWogL2jSbDHB0hW5uMwZsR')
            .expect(200)
            .expect('Content-type',/bmp/);
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
            .expect(/id/)
            .then(data => {
                return request(app)
                    .get('/image/get?id='+data.body['id'])
                    .expect(200)
                    .expect(/Valid Title/);
            });
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
            .expect(/id/)
            .then(data => {
                let id = data.body['id']
                return request(app)
                    .get('/image/get?id='+id)
                    .expect(401)
                    .then(() => {
                        return request(app)
                            .get('/image/get?id='+id+'&view-pass=ValidViewPass')
                            .expect(200);
                    });
            });
    });

    test('Fails with junk NSFW', () => {
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
            .expect(/id/)
            .then(data => {
                return request(app)
                    .get('/image/get?id='+data.body['id'])
                    .expect(200)
                    .expect(/nsfw.{0,3}true/);
            });
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
            .expect(/id/)
            .then(data => {
                return request(app)
                    .get('/image/get?id='+data.body['id'])
                    .expect(200)
                    .expect(/nsfw.{0,3}false/);
            });
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
            .expect(/id/)
            .then(data => {
                return request(app)
                    .get('/image/get?id='+data.body['id'])
                    .expect(200)
                    .expect(/Valid McAuthorson/);
            });
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
            .expect(/id/)
            .then(data => {
                return request(app)
                    .get('/image/get?id='+data.body['id'])
                    .expect(200)
                    .expect(/Lorem ipsum/);
            });
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
            .expect(/id/)
            .then(data => {
                let id = data.body['id']
                return request(app)
                    .get('/image/get?id='+id)
                    .expect(401)
                    .then(() => {
                        return request(app)
                            .get('/image/get?id='+id+'&view-pass=ValidViewPass')
                            .expect(200)
                            .expect(/Valid Title/)
                            .expect(/nsfw.{0,3}true/)
                            .expect(/Valid McAuthorson/)
                            .expect(/Lorem ipsum/)
                    })
            });
    });
});

describe('Test /image/verify', () => {
    test('Fails with no data', () => {
        return request(app)
            .post('/image/verify')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with no id', () => {
        return request(app)
            .post('/image/verify')
            .set('content-type','multipart/form-data')
            .field('edit-pass','fYNSSSsn7NmWtMqps8yx6+aG')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    })

    test('Fails with empty id', () => {
        return request(app)
            .post('/image/verify')
            .set('content-type','multipart/form-data')
            .field('id', '')
            .field('edit-pass','fYNSSSsn7NmWtMqps8yx6+aG')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails with not-found id', () => {
        return request(app)
            .post('/image/verify')
            .set('content-type','multipart/form-data')
            .field('id', 'af2fd9ea-159f-409c-a991-9db3c63320ee')
            .field('edit-pass','fYNSSSsn7NmWtMqps8yx6+aG')
            .expect(404)
            .expect('Content-type', /json/)
            .expect(/404/);
    });

    test('Fails with no edit-pass', () => {
        return request(app)
            .post('/image/verify')
            .set('content-type','multipart/form-data')
            .field('id', 'd46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Fails with empty edit-pass', () => {
        return request(app)
            .post('/image/verify')
            .set('content-type','multipart/form-data')
            .field('id', 'd46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .field('edit-pass', '')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Fails with wrong edit-pass', () => {
        return request(app)
            .post('/image/verify')
            .set('content-type','multipart/form-data')
            .field('id', 'd46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .field('edit-pass', 'qMQWogL2jSbDHB0hW5uMwZsR')
            .expect(403)
            .expect('Content-type', /json/)
            .expect(/403/);
    });

    test('Succeeds with correct data', () => {
        return request(app)
            .post('/image/verify')
            .set('content-type','multipart/form-data')
            .field('id', 'd46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .field('edit-pass', 'fYNSSSsn7NmWtMqps8yx6+aG')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/);
    });
});

describe('Test /image/update', () => {
    test('Fails with no data', () => {
        return request(app)
            .post('/image/update')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with no id', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('edit-pass','zR+sQBXLehcpoVlsIh2Od6gW')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    })

    test('Fails with empty id', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '')
            .field('edit-pass','zR+sQBXLehcpoVlsIh2Od6gW')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails with not-found id', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', 'af2fd9ea-159f-409c-a991-9db3c63320ee')
            .field('edit-pass','zR+sQBXLehcpoVlsIh2Od6gW')
            .expect(404)
            .expect('Content-type', /json/)
            .expect(/404/);
    });

    test('Fails with no edit-pass', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Fails with empty edit-pass', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', '')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Fails with wrong edit-pass', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'qMQWogL2jSbDHB0hW5uMwZsR')
            .expect(403)
            .expect('Content-type', /json/)
            .expect(/403/);
    });

    test('Succeeds with correct data', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/);
    });

    test('Fails with empty title', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('title','')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/title/);
    });

    test('Succeeds with new title', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('title','$TEST$ UPDATED')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type',/json/)
                    .expect(/\$TEST\$ UPDATED/);
            });
    });

    test('Fails with wrong file type', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .attach('file',fs.readFileSync('test_data/invalid.txt'),'invalid.txt')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/file/);
    });

    test('Fails with string as file', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('file','invalid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/file/);
    });

    test('Fails with empty file', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .attach('file',fs.readFileSync('test_data/invalid.jpg'),'invalid.jpg')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/file/);
    });

    test('Succeeds with new file', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .attach('file',fs.readFileSync('test_data/valid.jpg'),'valid.jpg')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/embed?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type',/jpe?g/);
            });
    });

    test('Succeeds with empty view-pass', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('view-pass','')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f')
                    .expect(200);
            });
    });

    test('Succeeds with new view-pass', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '0189bc8a-5c99-4c84-b567-607ce5d58e19')
            .field('edit-pass', 'UYSfG7T6m3FfCJViIMbbedIX')
            .field('view-pass','/7RZoQ/CwJ5QqCHYXAvErW7w')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=0189bc8a-5c99-4c84-b567-607ce5d58e19')
                    .expect(401)
                    .then(() => {
                        return request(app)
                            .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=/7RZoQ/CwJ5QqCHYXAvErW7w')
                            .expect(200);
                    });
            });
    });

    test('Ignores empty NSFW', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('nsfw','')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/);
    });

    test('Fails with junk NSFW', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('nsfw','banana')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/nsfw/);
    });

    test('Succeeds with true NSFW', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('nsfw','true')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type', /json/)
                    .expect(/nsfw.{0,3}true/);
            });
    });

    test('Succeeds with true NSFW', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('nsfw','false')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type', /json/)
                    .expect(/nsfw.{0,3}false/);
            });
    });

    test('Succeeds with empty author', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('author','')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type', /json/)
                    .expect(/author.{0,3}(''|"")/);
            });
    });

    test('Succeeds with new author', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('author','$TEST$ NEW AUTHOR')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type', /json/)
                    .expect(/\$TEST\$ NEW AUTHOR/);
            });
    });

    test('Succeeds with empty copyright', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('copyright','')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type', /json/)
                    .expect(/copyright.{0,3}(''|"")/);
            });
    });

    test('Succeeds with new copyright', () => {
        return request(app)
            .post('/image/update')
            .set('content-type','multipart/form-data')
            .field('id', '1f357f36-6e3f-465c-8633-45e109a1c40f')
            .field('edit-pass', 'zR+sQBXLehcpoVlsIh2Od6gW')
            .field('copyright','$TEST$ NEW COPYRIGHT')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=1f357f36-6e3f-465c-8633-45e109a1c40f&view-pass=aURrFQatFJea5SDjsPFlLRtw')
                    .expect(200)
                    .expect('Content-type', /json/)
                    .expect(/\$TEST\$ NEW COPYRIGHT/);
            });
    });
});

describe('Test /image/delete', () => {
    test('Fails with no data', () => {
        return request(app)
            .post('/image/delete')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with no id', () => {
        return request(app)
            .post('/image/delete')
            .set('content-type','multipart/form-data')
            .field('edit-pass','fYNSSSsn7NmWtMqps8yx6+aG')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    })

    test('Fails with empty id', () => {
        return request(app)
            .post('/image/delete')
            .set('content-type','multipart/form-data')
            .field('id', '')
            .field('edit-pass','fYNSSSsn7NmWtMqps8yx6+aG')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails with not-found id', () => {
        return request(app)
            .post('/image/delete')
            .set('content-type','multipart/form-data')
            .field('id', 'af2fd9ea-159f-409c-a991-9db3c63320ee')
            .field('edit-pass','fYNSSSsn7NmWtMqps8yx6+aG')
            .expect(404)
            .expect('Content-type', /json/)
            .expect(/404/);
    });

    test('Fails with no edit-pass', () => {
        return request(app)
            .post('/image/delete')
            .set('content-type','multipart/form-data')
            .field('id', 'd46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Fails with empty edit-pass', () => {
        return request(app)
            .post('/image/delete')
            .set('content-type','multipart/form-data')
            .field('id', 'd46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .field('edit-pass', '')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/edit-pass/);
    });

    test('Fails with wrong edit-pass', () => {
        return request(app)
            .post('/image/delete')
            .set('content-type','multipart/form-data')
            .field('id', 'd46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .field('edit-pass', 'qMQWogL2jSbDHB0hW5uMwZsR')
            .expect(403)
            .expect('Content-type', /json/)
            .expect(/403/);
    });

    test('Succeeds with correct data', () => {
        return request(app)
            .post('/image/delete')
            .set('content-type','multipart/form-data')
            .field('id', '32524b16-2a2a-4819-a835-a6d7d1e85a4f')
            .field('edit-pass', 'VWxLlHnbVAovGBSWt9VFOpZK')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/200/)
            .then(() => {
                return request(app)
                    .get('/image/get?id=32524b16-2a2a-4819-a835-a6d7d1e85a4f')
                    .expect(404);
            });
    });
});

describe('Test /comment/get', () => {
    test('Fails with no data', () => {
        return request(app)
            .get('/comment/get')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with empty id', () => {
        return request(app)
            .get('/comment/get?id')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails on not-found id', () => {
        return request(app)
            .get('/comment/get?id=af2fd9ea-159f-409c-a991-9db3c63320ee')
            .expect(404)
            .expect('Content-type', /json/)
            .expect(/404/);
    });

    test('Succeeds on public image', () => {
        return request(app)
            .get('/comment/get?id=0ed8d198-d63f-476f-9783-46edfc85bbee')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/\$TEST\$ PUBLIC COMMENT/);
    });

    test('Fails with no view-pass on private image', () => {
        return request(app)
            .get('/comment/get?id=d93f60af-0c72-4a99-98ac-166ea1ffc449')
            .expect(401)
            .expect('Content-type',/json/)
            .expect(/401/);
    });

    test('Fails with empty view-pass on private image', () => {
        return request(app)
            .get('/comment/get?id=d93f60af-0c72-4a99-98ac-166ea1ffc449&view-pass')
            .expect(401)
            .expect('Content-type',/json/)
            .expect(/401/);
    });

    test('Fails with wrong view-pass on private image', () => {
        return request(app)
            .get('/comment/get?id=d93f60af-0c72-4a99-98ac-166ea1ffc449&view-pass=DyXWO8O5AJHl6Ff5aZC3uwWD')
            .expect(403)
            .expect('Content-type',/json/)
            .expect(/403/);
    });

    test('Succeeds on private image', () => {
        return request(app)
            .get('/comment/get?id=d93f60af-0c72-4a99-98ac-166ea1ffc449&view-pass=qMQWogL2jSbDHB0hW5uMwZsR')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/\$TEST\$ PRIVATE COMMENT/);
    });
});

describe('Test /comment/list', () => {
    test('Fails with no data', () => {
        return request(app)
            .get('/comment/list')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with empty id', () => {
        return request(app)
            .get('/comment/list?id')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails on not-found id', () => {
        return request(app)
            .get('/comment/list?id=af2fd9ea-159f-409c-a991-9db3c63320ee')
            .expect(404)
            .expect('Content-type', /json/)
            .expect(/404/);
    });

    test('Succeeds on public image', () => {
        return request(app)
            .get('/comment/list?id=d46c8501-09d4-42a7-b87b-06d3fd89fffa')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/\$TEST\$ PUBLIC COMMENT/)
            .expect(/\$TEST\$ LONG COMMENT/);
    });

    test('Fails with no view-pass on private image', () => {
        return request(app)
            .get('/comment/list?id=a437764d-5af1-4beb-836e-9fa986fc1b10')
            .expect(401)
            .expect('Content-type',/json/)
            .expect(/401/);
    });

    test('Fails with empty view-pass on private image', () => {
        return request(app)
            .get('/comment/list?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass')
            .expect(401)
            .expect('Content-type',/json/)
            .expect(/401/);
    });

    test('Fails with wrong view-pass on private image', () => {
        return request(app)
            .get('/comment/list?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass=DyXWO8O5AJHl6Ff5aZC3uwWD')
            .expect(403)
            .expect('Content-type',/json/)
            .expect(/403/);
    });

    test('Succeeds on private image', () => {
        return request(app)
            .get('/comment/list?id=a437764d-5af1-4beb-836e-9fa986fc1b10&view-pass=qMQWogL2jSbDHB0hW5uMwZsR')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/\$TEST\$ PRIVATE COMMENT/);
    });

    test('Succeeds on image with no comments', () => {
        return request(app)
            .get('/comment/list?id=8d5d083e-2180-49bd-bd91-ae9931b49f09')
            .expect(200)
            .expect('Content-type',/json/)
            .expect(/\[\]/);
    });
});

describe('Test /comment/upload', () => {
    test('Fails with no data', () => {
        return request(app)
            .post('/comment/upload')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });

    test('Fails with no id', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('text','$TEST$ PUBLIC IMAGE')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails with empty id', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','')
            .field('text','$TEST$ PUBLIC IMAGE')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/id/);
    });

    test('Fails with not-found id', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','af2fd9ea-159f-409c-a991-9db3c63320ee')
            .field('text','$TEST$ PUBLIC IMAGE')
            .expect(404)
            .expect('Content-type', /json/)
            .expect(/404/);
    });

    test('Fails with no text', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','af2fd9ea-159f-409c-a991-9db3c63320ee')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/text/);
    })

    test('Fails with empty text', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','af2fd9ea-159f-409c-a991-9db3c63320ee')
            .field('text','')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/text/);
    })

    test('Succeeds on public image', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','8da01847-a996-49f8-96fa-363b1a3bd243')
            .field('text','$TEST$ PUBLIC IMAGE')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/)
            .then(() => {
                return request(app)
                    .get('/comment/list?id=8da01847-a996-49f8-96fa-363b1a3bd243')
                    .expect(200)
                    .expect(/Anonymous/)
                    .expect(/\$TEST\$ PUBLIC IMAGE/)
            });
    });

    test('Fails with no view-pass on private image', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','9f229eeb-1352-494f-8fae-cf13f3cbb457')
            .field('text','$TEST$ PRIVATE IMAGE')
            .expect(401)
            .expect('Content-type', /json/)
            .expect(/401/)
    });

    test('Fails with empty view-pass on private image', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','9f229eeb-1352-494f-8fae-cf13f3cbb457')
            .field('text','$TEST$ PRIVATE IMAGE')
            .field('view-pass','')
            .expect(401)
            .expect('Content-type', /json/)
            .expect(/401/)
    });

    test('Fails with wrong view-pass on private image', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','9f229eeb-1352-494f-8fae-cf13f3cbb457')
            .field('text','$TEST$ PRIVATE IMAGE')
            .field('view-pass','DyXWO8O5AJHl6Ff5aZC3uwWD')
            .expect(403)
            .expect('Content-type', /json/)
            .expect(/403/)
    });

    test('Succeeds on private image', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','9f229eeb-1352-494f-8fae-cf13f3cbb457')
            .field('text','$TEST$ PRIVATE IMAGE')
            .field('view-pass','jCeeR0UMfQDg+kGARcLR2GxJ')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/)
            .then(() => {
                return request(app)
                    .get('/comment/list?id=9f229eeb-1352-494f-8fae-cf13f3cbb457&view-pass=jCeeR0UMfQDg%2BkGARcLR2GxJ')
                    .expect(200)
                    .expect(/Anonymous/)
                    .expect(/\$TEST\$ PRIVATE IMAGE/)
            });
    });

    test('Succeeds with empty display-name', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','8da01847-a996-49f8-96fa-363b1a3bd243')
            .field('text','$TEST$ EMPTY NAME')
            .field('display-name','')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/)
            .then(() => {
                return request(app)
                    .get('/comment/list?id=8da01847-a996-49f8-96fa-363b1a3bd243')
                    .expect(200)
                    .expect(/Anonymous/)
                    .expect(/\$TEST\$ EMPTY NAME/)
            });
    });

    test('Succeeds with display-name', () => {
        return request(app)
            .post('/comment/upload')
            .set('content-type','multipart/form-data')
            .field('id','8da01847-a996-49f8-96fa-363b1a3bd243')
            .field('text','$TEST$ SET NAME')
            .field('display-name','$TEST$ Nonymous')
            .expect(200)
            .expect('Content-type', /json/)
            .expect(/id/)
            .then(() => {
                return request(app)
                    .get('/comment/list?id=8da01847-a996-49f8-96fa-363b1a3bd243')
                    .expect(200)
                    .expect(/\$TEST\$ Nonymous/)
                    .expect(/\$TEST\$ SET NAME/)
            });
    });
});