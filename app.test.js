/* eslint-disable */
'use strict';

const request = require('supertest');
const app = require('./app');

describe('Test the /image calls', () => {
    test('POST /image/upload fails with no data', () => {
        return request(app)
            .post('/image/upload')
            .expect(400)
            .expect('Content-type', /json/)
            .expect(/invalid/);
    });
    // don't know how to mock a file upload
});