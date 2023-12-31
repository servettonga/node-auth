import { createAuthorizedDummy } from '#tests/userTest.js';
import cacheExternal from '#utils/cacheExternal.js';
import * as db from '#utils/db.js';

import { createServer } from '#utils/server.js';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let server;
let dummy;
let admin;

beforeAll(async () => {
    server = await createServer();
    await db.setup();
    dummy = await createAuthorizedDummy();
    admin = await createAuthorizedDummy(true);
    await cacheExternal.open();
});

afterAll(async () => {
    await db.teardown();
    await cacheExternal.close();
});

describe('GET /api/v1/users', () => {
    it('should return 200 OK & valid response if username param is set', async () => {
        await request(server)
            .get(`/api/v1/users?username=${ dummy.username }`)
            .set('Authorization', `Bearer ${ admin.token }`)
            .then(res => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(200);
                expect(res.body).toEqual([{
                    _id: dummy.userId,
                    username: dummy.username,
                    email: dummy.email,
                    admin: false,
                    active: true,
                    created: expect.any(String)
                }]);
            });
    });

    it('should return 200 OK & valid response if admin param is set', async () => {
        await request(server)
            .get('/api/v1/users?admin=true')
            .set('Authorization', `Bearer ${ admin.token }`)
            .then(res => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(200);
                expect(res.body).toEqual([{
                    _id: admin.userId,
                    username: admin.username,
                    email: admin.email,
                    admin: true,
                    active: true,
                    created: expect.any(String)
                }]);
            });
    });

    it('should return 400 & valid error response if username param is empty', async () => {
        await request(server)
            .get('/api/v1/users?username=')
            .set('Authorization', `Bearer ${ admin.token }`)
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(400);
                expect(res.body).toMatchObject({
                    error: {
                        type: 'request_validation_error',
                        message: expect.stringMatching(/Empty.*'username'/)
                    }
                });
            });
    });

    it('should return 404 & valid error response if no parameter was given', async () => {
        await request(server)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${ admin.token }`)
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(404);
                expect(res.body).toMatchObject({
                    message: expect.stringMatching(/empty/i)
                });
            });
    });

    it('should return 401 & valid error response if token is invalid', async () => {
        await request(server)
            .get('/api/v1/users?username=test')
            .set('Authorization', 'Bearer invalidToken')
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(401);
                expect(res.body).toMatchObject({
                    error: {
                        type: 'authentication_error',
                        message: expect.stringMatching(/unauthorized/i)
                    }
                });
            });
    });

    it('should return 401 & valid error response if token is missing', async () => {
        await request(server)
            .get('/api/v1/users?username=test')
            .then(res => {
                expect(res.statusCode).toBe(401);
                expect(res.type).toBe('application/json');
                expect(res.body).toMatchObject({
                    error: {
                        type: 'request_validation_error',
                        message: expect.stringMatching(/header/i)
                    }
                });
            });
    });

});
