import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { faker } from '@faker-js/faker';

import { createServer } from '#utils/server.js';
import * as db from "#utils/db.js";
import { createAuthorizedDummy } from "#tests/userTest.js";
import cacheExternal from "#utils/cacheExternal.js";

let server;
let dummy;

beforeAll(async () => {
    server = await createServer();
    await db.setup();
    dummy = await createAuthorizedDummy();
    await cacheExternal.open();
})

afterAll(async () => {
    await db.teardown();
    await cacheExternal.close();
})


describe('GET /api/v1/users', () => {
    it('should return 200 OK', async () => {
        await request(server)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${dummy.token}`)
            .then(res => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(200);
                expect(res.body).toMatchObject({ message: 'Hello, World!' });
            })
    })

    it('should return 200 OK & valid response if username param is set', async () => {
        await request(server)
            .get('/api/v1/users?username=test%20name')
            .set('Authorization', `Bearer ${dummy.token}`)
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(200);
                expect(res.body).toMatchObject({ 'message': 'Hello, test name!' })
            })
    })

    it('should return 400 & valid error response if username param is empty', async () => {
        await request(server)
            .get('/api/v1/users?username=')
            .set('Authorization', `Bearer ${dummy.token}`)
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(400);
                expect(res.body).toMatchObject({
                    error: {
                        type: 'request_validation',
                        message: expect.stringMatching(/Empty.*'username'/),
                        errors: expect.anything()
                    }
                })
            })
    })

    it('should return 401 & valid error response if token is invalid', async () => {
        await request(server)
            .get('/api/v1/users?username=test')
            .set('Authorization', 'Bearer invalidToken')
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(401);
                expect(res.body).toMatchObject({
                    error: {
                        type: 'Unauthorized',
                        message: 'Authorization Failed'
                    }
                })
            })
    })

    it('should return 401 & valid error response if token is missing', async () => {
        await request(server)
            .get('/api/v1/users?username=test')
            .then(res => {
                expect(res.statusCode).toBe(401);
                expect(res.type).toBe('application/json');
                expect(res.body).toMatchObject({
                    error: {
                        type: 'request_validation',
                        message: 'Authorization header required',
                        errors: expect.anything()
                    }
                })
            })
    })

})
