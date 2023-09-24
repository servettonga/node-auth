/* istanbul ignore file */
import { faker } from '@faker-js/faker';
import logger from '#utils/logger.js';

import User from '#models/user.js'
import { createAuthToken } from "#services/userService.js";

export function dummyUser() {
    return {
        username: faker.internet.displayName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.internet.password(10)
    }
}

export async function createDummy() {
    try {
        const user = dummyUser();
        const dbUser = new User(user);
        await dbUser.save();
        return {...user, userId: dbUser._id.toString()}
    } catch (e) {
        logger.warn(`Couldn\'t create a dummy: ${e.message}`);
        throw Error('Couldn\'t create a dummy', e)
    }
}

export async function createAuthorizedDummy() {
    try {
        const user = await createDummy();
        const authToken = await createAuthToken(user.userId, true);
        return {...user, token: authToken.token}
    } catch (e) {
        logger.warn(`Couldn\'t create an authorized dummy: ${e.message}`);
        throw Error('Couldn\'t create an authorized dummy')
    }
}
