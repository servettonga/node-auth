import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken'

import * as userService from '#services/userService.js';
import { createDummy, createAuthorizedDummy } from "#tests/userTest.js";
import * as db from '#utils/db.js';
import { createAuthToken } from "#services/userService.js";
import cacheExternal from "#utils/cacheExternal.js";
import request from "supertest";
import { performance, PerformanceObserver } from "perf_hooks";


beforeAll(async () => {
    await db.setup();
    await cacheExternal.open();

    const perfObserver = new PerformanceObserver((items) => {
        items.getEntries().forEach((entry) => {
            console.log(`test: ${entry.name}\nrps: ${Math.floor(1000 / entry.duration)}`);
        })
    })
    perfObserver.observe({ entryTypes: ["measure"], buffered: true});
})

afterAll(async () => {
    await db.teardown();
    await cacheExternal.close();
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

    it('login performance', async () => {
        const dummy = await createAuthorizedDummy()
        const now = new Date().getTime()
        let i;
        for (i = 0; new Date().getTime() - now < 1000; i++) {
            await userService.login({
                username: dummy.username,
                password: dummy.password
            })
        }
        console.log(`User service - login rps: ${i}`)
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
        expect(userInDb.active).toEqual(true)
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
        performance.mark("req-start")
        await userService.authentication(`Bearer ${dummy.token}`)
        performance.mark("req-end")
        performance.measure("authentication-unit", "req-start", "req-end")

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
