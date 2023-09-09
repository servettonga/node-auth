import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken'

import * as userService from '#services/user.js';
import { createDummy, createAuthorizedDummy } from "#tests/userTest.js";
import * as db from '#utils/db.js';
import { createAuthToken } from "#services/user.js";


beforeAll(async () => {
    await db.setup();
})

afterAll(async () => {
    await db.teardown();
})

describe('login', () => {
    it('should return JWT token, userId, expireAt to validate login', async () => {
        const dummy = await createDummy();
        await expect(userService.login(dummy.username, dummy.password)).resolves.toEqual({
            userId: dummy.userId,
            token: expect.stringMatching(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/),
            expireAt: expect.any(Date)
        })
    })

    it('should reject with error if username does not exist', async () => {
        const fake = {
            username: faker.internet.displayName(),
            password: faker.internet.password(10)
        }
        await expect(userService.login(fake.username, fake.password)).resolves.toEqual({
            error: {type: 'invalid_credentials', message: 'Invalid username or password'}
        })
    })

    it('should reject with error if password is wrong', async () => {
        const dummy = await createDummy();
        await expect(userService.login(dummy.username, faker.internet.password(10))).resolves.toEqual({
            error: {type: 'invalid_credentials', message: 'Invalid username or password'}
        })
    })

    it('should reject with error if no parameter were passed', async () => {
        await expect(userService.login()).resolves.toEqual({
            error: {type: 'invalid_request', message: expect.stringMatching(/username/i)}
        })
    })

})

describe('createUser', () => {
    it('should create and return a new user', async () => {
        const userToBeCreated = {
            username: faker.internet.displayName(),
            email: faker.internet.email().toLowerCase(),
            password: faker.internet.password(10)
        }
        const userInDb = await userService.createUser(userToBeCreated)
        expect(userInDb.username).toEqual(userToBeCreated.username)
        expect(userInDb.email).toEqual(userToBeCreated.email)
        expect(userInDb.password).not.toEqual(userToBeCreated.password)
        expect(userInDb.isAdmin).toEqual(false)
        expect(userInDb.created.getTime()).toBeLessThan(Date.now())
    })

    it('should reject with error if a parameter was missing', async () => {
        const userToBeCreated = {
            username: faker.internet.displayName(),
            email: faker.internet.email().toLowerCase(),
        }
        await expect(userService.createUser(userToBeCreated)).not.resolves

    })

})

describe('authentication', () => {
    it('should resolve token true for valid token', async () => {
        const dummy = await createAuthorizedDummy();
        await expect(userService.authentication(dummy.token)).resolves.toEqual({
            userId: dummy.userId
        })
    })

    it('should resolve token false for invalid token', async () => {
        await expect(userService.authentication('invalidToken')).resolves.toEqual({
            error: { type: 'Unauthorized', message: 'Authorization Failed' }
        })
    })

    it('authentication performance test', async () => {
        const dummy = await createAuthorizedDummy()
        const now = new Date().getTime()
        let i = 0
        do {
            i += 1
            await userService.authentication(`Bearer ${dummy.token}`)
        } while (new Date().getTime() - now < 1000)
        console.log(`auth performance: ${i}`)
    })

})

describe('createAuthToken', () => {
    it('should return internal_server_error if jwt fails', async () => {
        (jwt.sign) = (payload, secretOrPrivateKey, options, callback) => {
            callback({ error: 'Token couldn\'t be created' }, undefined)
        }
        const dummy = await createDummy();
        await expect(userService.login(dummy.username, dummy.password)).resolves.toEqual({
            error: {type: 'internal_server_error', message: 'Internal Server Error'}
        })
    })

})
