import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { faker } from '@faker-js/faker';
import { performance, PerformanceObserver } from 'perf_hooks';

import { createServer } from '#utils/server.js';
import * as db from "#utils/db.js";
import { createDummy } from "#tests/userTest.js";
import cacheExternal from "#utils/cacheExternal.js";

let server;

beforeAll(async () => {
    server = await createServer();
    await db.setup();
    await cacheExternal.open();
})

afterAll(async () => {
    await db.teardown();
    await cacheExternal.close();
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

    it('login request performance test', async () => {
        const dummy = await createDummy();
        const now = new Date().getTime()
        let i;
        for (i = 0; new Date().getTime() - now < 1000; i++) {
            await request(server)
                .post('/api/v1/login')
                .send({
                    username: dummy.username,
                    password: dummy.password
                })
        }
        console.log(`Route - login rps: ${i}`)
    })

})
