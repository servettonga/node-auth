import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { faker } from '@faker-js/faker';

import { createServer } from '#utils/server.js';
import * as db from "#utils/db.js";
import { createAuthorizedDummy, createDummy } from "#tests/userTest.js";

let server;
let dummy;

beforeAll(async () => {
    server = await createServer();
    await db.setup();
    dummy = await createAuthorizedDummy();
})

afterAll(async () => {
    await db.teardown();
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


describe('GET /api/v1/login', () => {
    it('should return 200 & valid response for a valid login request', async () => {
        const dummy = await createDummy();
        const headerReg = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/;
        const userIdReg = /^[a-f0-9]{24}$/;
        const tokenReg = /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-+\/=]*)/gm;
        const response = await request(server)
            .post('/api/v1/login')
            .send({
                username: dummy.username,
                password: dummy.password
            })
        expect(response.statusCode).toBe(200)
        expect(response.header['x-expires-after']).toMatch(headerReg)
        expect(response.body).toEqual({
            userId: expect.stringMatching(userIdReg),
            token: expect.stringMatching(tokenReg)
        })
    })

    it('should return 404 & valid response for a non-existing user', async () => {
        const response = await request(server)
            .post('/api/v1/login')
            .send({
                username: faker.internet.displayName(),
                password: faker.internet.password()
            })
        expect(response.statusCode).toBe(404)
        expect(response.body).toEqual({
            error: {type: 'invalid_credentials', message: 'Invalid username or password'}
        })
    })

    it('should return 400 & valid response for invalid request', async () => {
        const response = await request(server)
            .post('/api/v1/login')
            .send({
                username: '',
                password: faker.internet.password()
            })
        expect(response.statusCode).toBe(400)
        expect(response.body).toMatchObject({
            error: {type: 'invalid_request', message: expect.stringMatching(/username/i)}
        })
    })

})
