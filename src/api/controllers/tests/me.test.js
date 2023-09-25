import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from "vitest";

import { createServer } from "#utils/server.js";
import { createAuthorizedDummy } from '#tests/userTest.js';
import * as db from "#utils/db.js";

let server;

beforeAll(async () => {
    server = await createServer();
    await db.setup();
});

afterAll(async () => {
    await db.teardown();
});

describe('GET /api/v1/me', () => {
    it('should return 401 for unauthenticated request', async () => {
		const response = await request(server)
			.get('/api/v1/me')
		expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            error: {
                type: expect.stringMatching('request_validation_error'),
                message: expect.stringMatching(/header/i)
            }
        });
	});

    it('should return 200 and user data for authenticated request', async () => {
        const dummy = await createAuthorizedDummy();
        const response = await request(server)
            .get('/api/v1/me')
            .set('Authorization', `Bearer ${dummy.token}`)
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            username: dummy.username,
            email: dummy.email,
            admin: false,
            active: true,
            created: expect.any(String)
        });
    });
})
