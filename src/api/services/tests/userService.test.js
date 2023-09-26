import User from '#models/user.js';

import * as userService from '#services/userService.js';
import { createAuthToken } from '#services/userService.js';
import { createAuthorizedDummy, createDummy } from '#tests/userTest.js';
import cacheExternal from '#utils/cacheExternal.js';
import * as db from '#utils/db.js';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import { performance, PerformanceObserver } from 'perf_hooks';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

beforeAll(async () => {
    await db.setup();
    await cacheExternal.open();

    const perfObserver = new PerformanceObserver((items) => {
        items.getEntries().forEach((entry) => {
            console.log(`test: ${ entry.name }\nrps: ${ Math.floor(1000 / entry.duration) }`);
        });
    });
    perfObserver.observe({ entryTypes: ['measure'], buffered: true });
});

afterAll(async () => {
    await db.teardown();
    await cacheExternal.close();
});

beforeEach(async () => {
    await db.clearDatabase();
});

const userIdReg = /^[a-f0-9]{24}$/;
const tokenReg = /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-+\/=]*)/gm;

describe('login', () => {
    it('should return JWT token, userId, expireAt to validate loginUser', async () => {
        const dummy = await createDummy();
        await expect(userService.loginUser(dummy.username, dummy.password)).resolves.toEqual({
            userId: dummy.userId,
            token: expect.stringMatching(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/),
            expireAt: expect.any(Date)
        });
    });

    it('should reject with error if username does not exist', async () => {
        const fake = {
            username: faker.internet.displayName(),
            password: faker.internet.password(10)
        };
        await expect(userService.loginUser(fake.username, fake.password)).resolves.toEqual({
            error: { type: 'invalid_credentials', message: 'Invalid username or password' }
        });
    });

    it('should reject with error if password is wrong', async () => {
        const dummy = await createDummy();
        await expect(userService.loginUser(dummy.username, faker.internet.password(10))).resolves.toEqual({
            error: { type: 'invalid_credentials', message: 'Invalid username or password' }
        });
    });

    it('should reject with error if no parameter were passed', async () => {
        await expect(userService.loginUser()).resolves.toEqual({
            error: { type: 'invalid_request', message: expect.stringMatching(/username/i) }
        });
    });

    it('loginUser performance', async () => {
        const dummy = await createAuthorizedDummy();
        const now = new Date().getTime();
        let i;
        for (i = 0; new Date().getTime() - now < 1000; i++) {
            await userService.loginUser({
                username: dummy.username,
                password: dummy.password
            });
        }
        console.log(`User service - login rps: ${ i }`);
    });

});

describe('createUser', () => {
    it('should create and return a new user', async () => {
        const username = faker.internet.displayName();
        const email = faker.internet.email().toLowerCase();
        const password = faker.internet.password(10);
        await expect(userService.createUser(username, email, password)).resolves.toEqual({
            userId: expect.stringMatching(userIdReg),
            token: expect.stringMatching(tokenReg),
            expireAt: expect.any(Date)
        });
    });

    it('should reject with error if a parameter was missing', async () => {
        const username = faker.internet.displayName();
        const email = faker.internet.email().toLowerCase();
        await expect(userService.createUser(username, email)).resolves.toEqual({
            error: {
                type: 'required_field_error',
                message: expect.stringMatching(/required/i)
            }
        });
    });

});

describe('updateUser', () => {
    it('should update user', async () => {
        const dummy = await createDummy();
        const newEmail = faker.internet.email().toLowerCase();
        await expect(userService.updateUser(dummy, { email: newEmail })).resolves.toEqual({
            userId: expect.stringMatching(userIdReg),
            token: expect.stringMatching(tokenReg),
            expireAt: expect.any(Date)
        });
        const updatedUser = await User.findById(dummy.userId);
        expect(updatedUser.email).toEqual(newEmail);
    });

    it('should reject with error if invalid user id passed', async () => {
        await expect(userService.updateUser({ _id: 'invalid' }, { email: 'test@test.com' })).resolves.toEqual({
            error: {
                type: 'not_found_error',
                message: 'User not found'
            }
        });
    });

    it('should reject with error if invalid fields passed', async () => {
        const dummy = await createDummy();
        await expect(userService.updateUser(dummy, { invalid: 'test' })).resolves.toEqual({
            error: {
                type: 'validation_error',
                message: 'Invalid fields'
            }
        });
    });
});

describe('deleteUser', () => {
    it('should delete user', async () => {
        const dummy = await createDummy();
        const response = await userService.deleteUser(dummy.username);
        expect(response).toContain({
            username: dummy.username,
            email: dummy.email,
            admin: false,
            active: true
        });
        const deletedUser = await User.findOne({ username: dummy.username });
        expect(deletedUser).toBeNull();
    });

    it('should return null if user not found', async () => {
        const fakeUsername = faker.internet.displayName();
        const response = await userService.deleteUser(fakeUsername);
        expect(response).toBeNull();
    });
});

describe('getUsers', () => {
    it('should return a valid array of users', async () => {
        const dummy1 = await createDummy();
        const dummy2 = await createDummy();
        const response = await userService.getUsers({ active: true });
        expect(response[0]._id.toString()).toEqual(dummy1.userId);
        expect(response[0].username).toEqual(dummy1.username);
        expect(response[0].email).toEqual(dummy1.email);
        expect(response[0].admin).toEqual(false);
        expect(response[0].active).toEqual(true);
        expect(response[0].created).toBeDefined();
        expect(response[1]._id.toString()).toEqual(dummy2.userId);
        expect(response[1].username).toEqual(dummy2.username);
        expect(response[1].email).toEqual(dummy2.email);
        expect(response[1].admin).toEqual(false);
        expect(response[1].active).toEqual(true);
        expect(response[1].created).toBeDefined();
    });

    it('should return a valid response if no users found', async () => {
        const response = await userService.getUsers({});
        expect(response).toEqual({
            error: {
                type: 'not_found_error',
                message: 'No users found'
            }
        });
    });
});

describe('authentication', () => {
    it('should resolve token true for valid token', async () => {
        const dummy = await createAuthorizedDummy();
        await expect(userService.authentication(dummy.token)).resolves.toEqual({
            userId: dummy.userId
        });
    });

    it('should resolve token false for invalid token', async () => {
        await expect(userService.authentication('invalidToken')).resolves.toEqual({
            error: { type: 'Unauthorized', message: 'Authorization Failed' }
        });
    });

    it('authentication performance test', async () => {
        const dummy = await createAuthorizedDummy();
        performance.mark('req-start');
        await userService.authentication(`Bearer ${ dummy.token }`);
        performance.mark('req-end');
        performance.measure('authentication-unit', 'req-start', 'req-end');

    });

});

describe('createAuthToken', () => {
    it('should return internal_server_error if jwt fails', async () => {
        (jwt.sign) = (payload, secretOrPrivateKey, options, callback) => {
            callback({ error: 'Token couldn\'t be created' }, undefined);
        };
        const dummy = await createDummy();
        await expect(userService.loginUser(dummy.username, dummy.password)).resolves.toEqual({
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - Login Error ',
                reason: expect.stringMatching(/token/i)
            }
        });
    });

});
