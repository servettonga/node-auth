import { createAuthorizedDummy, createDummy } from '#tests/userTest.js';
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

describe('DELETE /api/v1/delete?username=:username', () => {
    it('should return 200 for a valid delete request', async () => {
        const admin = await createAuthorizedDummy(true);
        const dummy = await createDummy();
        const response = await request(server)
            .delete(`/api/v1/delete?username=${dummy.username}`)
            .set('Authorization', `Bearer ${admin.token}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            message: expect.stringMatching(/deleted/i)
        })
    });


    it('should return 401 for delete request without header', async () => {
        const response = await request(server)
            .delete(`/api/v1/delete?username=fakeUser`)
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            error: {
                type: expect.stringMatching('request_validation_error'),
                message: expect.stringMatching(/header/i)
            }
        })
    });

    it('should return 401 for delete request without admin token', async () => {
        const dummy = await createAuthorizedDummy();
        const response = await request(server)
            .delete(`/api/v1/delete?username=fakeUser`)
            .set('Authorization', `Bearer ${dummy.token}`);
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            message: expect.stringMatching(/unauthorized/i)
        });
    });

    it('should return 404 for an invalid delete request', async () => {
        const admin = await createAuthorizedDummy(true);
        const response = await request(server)
            .delete(`/api/v1/delete?username=fakeUser`)
            .set('Authorization', `Bearer ${admin.token}`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
            message: expect.stringMatching(/not found/i)
        })
    });

    it('should return 400 for delete request own self', async () => {
        const admin = await createAuthorizedDummy(true);
        const response = await request(server)
            .delete(`/api/v1/delete?username=${admin.username}`)
            .set('Authorization', `Bearer ${admin.token}`);
        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            message: expect.stringMatching(/own/i)
        })
    });
});
