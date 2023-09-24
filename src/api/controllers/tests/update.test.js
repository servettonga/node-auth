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
const userIdReg = /^[a-f0-9]{24}$/;
const tokenReg = /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-+\/=]*)/gm;

describe('PATH /api/v1/update', () => {
    it('should return 200 for a valid update request', async () => {
        const dummy = await createAuthorizedDummy();
        const updateData = { email: 'new_email@test.com' };
        const response = await request(server)
            .patch('/api/v1/update')
            .set('Authorization', `Bearer ${ dummy.token }`)
            .send(updateData);
        expect(response.statusCode).toBe(200);
        expect(response.header['x-expires-after']).toMatch(headerReg);
        expect(response.body).toEqual({
            userId: expect.stringMatching(userIdReg),
            token: expect.stringMatching(tokenReg)
        });
    });

    it('should return 401 for an unauthorized update request', async () => {
        const updateData = { email: 'new_email@test.com' };
        const response = await request(server)
            .patch('/api/v1/update')
            .send(updateData);
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            error: {
                type: expect.stringMatching('request_validation'),
                message: expect.stringMatching(/authorization/i),
                errors: expect.anything()
            }
        });
    });

    it('should return 404 for an empty update request', async () => {
        const dummy = await createAuthorizedDummy();
        const response = await request(server)
            .patch('/api/v1/update')
            .set('Authorization', `Bearer ${ dummy.token }`)
            .send({});
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            message: expect.stringMatching(/nothing/i)
        });
    });

});
