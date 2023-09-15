import { faker } from '@faker-js/faker';
import { beforeAll, beforeEach, afterAll, expect, describe, it, vi } from 'vitest';

import * as db from '#utils/db.js';
import User from '#models/user.js';

let testUser;
let testUser2;

beforeAll(async () => {
    await db.setup();
})

beforeEach(async () => {
    testUser = {
        username: faker.internet.displayName(),
        email: faker.internet.email(),
        password: faker.internet.password(10)
    };
    testUser2 = {
        username: faker.internet.displayName(),
        email: faker.internet.email(),
        password: faker.internet.password(10)
    };
})

afterAll(async () => {
    await db.teardown();
})

describe('save user', () => {
    it('should save a user', async () => {
        const before = Date.now();
        const user = new User(testUser);
        await user.save();
        const after = Date.now();
        const fetchedUser = await User.findOne({ username: user.username });

        expect(fetchedUser.username).toEqual(user.username);
        expect(fetchedUser.email).toEqual(user.email);
        expect(fetchedUser.password).not.toEqual(testUser.password);
        expect(fetchedUser.created.getTime()).toBeGreaterThanOrEqual(before);
        expect(fetchedUser.created.getTime()).toBeLessThanOrEqual(after);
    })

    it('should update a user', async () => {
        const user = new User(testUser);
        await user.save();
        user.username = testUser2.username;
        await user.save();
        expect(user.username).toEqual(testUser2.username);
    })

    it('should not save a user with invalid email', async () => {
        const user = new User(testUser);
        user.email = 'invalid';
        await expect(user.save()).rejects.toThrow(/email/);
    })

    it('should not save a user without a password', async () => {
        delete testUser.password;
        const user = new User(testUser);
        await expect(user.save()).rejects.toThrow(/password/);
    })

    it('should not save a user without a username', async () => {
        delete testUser.username;
        const user = new User(testUser);
        await expect(user.save()).rejects.toThrow(/username/);
    })

    it('should not save a user with a duplicate email', async () => {
        const user = new User(testUser)
        await user.save();
        const user2 = new User(testUser2);
        user2.email = user.email;
        await expect(user2.save()).rejects.toThrow(/email/);
    })

    it('should not save a user with a duplicate username', async () => {
        const user = new User(testUser)
        await user.save();
        const user2 = new User(testUser2);
        user2.username = user.username;
        await expect(user2.save()).rejects.toThrow(/username/);
    })

    it('should not save password in plain text', async () => {
        const user = new User(testUser)
        await user.save();
        expect(user.password).not.toEqual(testUser.password);
    })

    it('should update password hash if password is changed', async () => {
        const user = new User(testUser)
        await user.save();
        const newPassword = faker.internet.password();
        user.password = newPassword;
        await user.save();
        const fetchedUser = await User.findOne({ username: user.username });
        expect(fetchedUser.password).not.toEqual(newPassword);
    })
})

describe('toJSON', () => {
    it('should return valid JSON', async () => {
        const user = new User(testUser)
        await user.save();
        const json = user.toJSON();
        expect(json).toEqual({
            email: testUser.email.toLowerCase(),
            username: testUser.username,
            admin: false,
            active: true,
            created: expect.any(Number),
        })
    })
})
