import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { faker } from '@faker-js/faker';

import { createServer } from "#utils/server.js";
import { createDummy } from "#tests/userTest.js";
import * as db from "#utils/db.js";

let server;

beforeAll(async () => {
    server = await createServer();
    await db.setup();
});

afterAll(async () => {
    await db.teardown();
});

describe('GET /api/v1/register', () => {
    it('should return 200 & valid response for a valid registry request', async () => {
        const username = faker.internet.displayName();
        const email = faker.internet.email().toLowerCase();
        const password = faker.internet.password(10);
        const userIdReg = /^[a-f0-9]{24}$/;
        const tokenReg = /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-+\/=]*)/gm;
        const response = await request(server)
            .post('/api/v1/register')
            .send({
                username: username,
                email: email,
                password: password
            })
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
            userId: expect.stringMatching(userIdReg),
            token: expect.stringMatching(tokenReg)
        });
    });

    it('should return 409 & valid response for existing email', async () => {
        const dummy = await createDummy();
        const response = await request(server)
            .post('/api/v1/register')
            .send({
                username: faker.internet.displayName(),
                email: dummy.email,
                password: dummy.password
            })
        expect(response.statusCode).toBe(409)
        expect(response.body).toEqual({
            error: expect.stringMatching(/email/i)
        });
    });

    it('should return 409 & valid response for existing username', async () => {
        const dummy = await createDummy();
        const response = await request(server)
            .post('/api/v1/register')
            .send({
                username: dummy.username,
                email: faker.internet.email().toLowerCase(),
                password: dummy.password
            })
        expect(response.statusCode).toBe(409)
        expect(response.body).toEqual({
            error: expect.stringMatching(/username/i)
        });
    });

    it('should return 400 & valid response for invalid registry request', async () => {
        const dummy = await createDummy();
        const response = await request(server)
            .post('/api/v1/register')
            .send({
                username: dummy.username,
                email: dummy.email
            })
        expect(response.statusCode).toBe(400)
        expect(response.body).toEqual({
            error: expect.stringMatching(/required/i)
        });
    });

})
