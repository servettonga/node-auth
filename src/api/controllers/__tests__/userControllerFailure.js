import request from 'supertest';
import { expect, jest, it } from '@jest/globals';
import { mocked } from 'jest-mock';

import { createServer } from '#utils/server.js';


const mockAuth = jest.fn();
jest.mock('#controllers/userController.js', () => ({
    get auth() {
        return mockAuth;
    }
}));

let server;

beforeAll(async () => {
    server = await createServer();
})

describe('Authentication failure', () => {
    it('should return 500 & valid response if authentication rejects with an error', async () => {
        mockAuth.mockRejectedValue(new Error());
        await request(server)
            .get('/api/v1/users')
            .set('Authorization', 'Bearer fakeToken')
            .then(res => {
                expect(res.statusCode).toBe(500);
                expect(res.body).toMatchObject({
                    error: {
                        type: 'internal_server_error',
                        message: 'Internal Server Error'
                    }
                })
            });
    })
})
