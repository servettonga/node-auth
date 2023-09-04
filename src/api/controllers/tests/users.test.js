import request from 'supertest';
import { beforeAll, describe, it, expect } from "vitest";

import { createServer } from '#utils/server.js';

let server;

beforeAll(async () => {
    server = await createServer();
})

describe('GET /api/v1/users', () => {
    it('should return 200 OK', async () => {
        await request(server)
            .get('/api/v1/users')
            .set('Authorization', 'Bearer fakeToken')
            .then(res => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(200);
                expect(res.body).toMatchObject({ message: 'Hello, World!' });
            })
    })

    it('should return 200 OK & valid response if username param is set', async () => {
        await request(server)
            .get('/api/v1/users?username=test%20name')
            .set('Authorization', 'Bearer fakeToken')
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(200);
                expect(res.body).toMatchObject({ 'message': 'Hello, test name!' })
            })
    })

    it('should return 400 & valid error response if username param is empty', async () => {
        await request(server)
            .get('/api/v1/users?username=')
            .set('Authorization', 'Bearer fakeToken')
            .then((res) => {
                expect(res.type).toBe('application/json');
                expect(res.statusCode).toBe(400);
                expect(res.body).toMatchObject({
                    error: {
                        type: 'request_validation',
                        message: expect.stringMatching(/Empty.*\'username\'/),
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
                        message: 'Invalid token'
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
