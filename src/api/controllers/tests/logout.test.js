import { createAuthorizedDummy } from '#tests/userTest.js';
import cacheExternal from '#utils/cacheExternal.js';
import * as db from '#utils/db.js';

import { createServer } from '#utils/server.js';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let server;

beforeAll(async () => {
    server = await createServer();
    await db.setup();
    await cacheExternal.open();
});

afterAll(async () => {
    await db.teardown();
    await cacheExternal.close();
});

const headerReg = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/;

describe('GET /api/v1/logout', () => {
    it('should logout user and return expired token', async () => {
        const dummy = await createAuthorizedDummy();
        // login
        const loginResponse = await request(server)
            .post('/api/v1/login')
            .send({
                username: dummy.username,
                password: dummy.password
            });
        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.header['x-expires-after']).toMatch(headerReg);
        expect(loginResponse.body).not.toEqual({
            token: dummy.token
        });
        // logout
        const logoutResponse = await request(server)
            .get('/api/v1/logout')
            .set('Authorization', `Bearer ${ dummy.token }`);
        expect(logoutResponse.statusCode).toBe(200);
        expect(logoutResponse.header['x-expires-after']).toMatch(headerReg);
        expect(logoutResponse.body).toEqual({
            userId: dummy.userId,
            token: expect.not.stringMatching(loginResponse.body.token)
        });
    });

    it('should return 401 for logout without authentication', async () => {
        const response = await request(server)
            .get('/api/v1/logout');
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            error: {
                type: expect.stringMatching('request_validation_error'),
                message: expect.stringMatching(/header/i)
            }
        });
    });
});
