/* istanbul ignore file */
import { faker } from '@faker-js/faker';

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
        throw Error('Couldn\'t create a dummy', e)
    }
}

export async function createAuthorizedDummy() {
    try {
        const user = await createDummy();
        const authToken = await createAuthToken(user.userId);
        return {...user, token: authToken.token}
    } catch (e) {
        throw Error('Couldn\'t create an authorized dummy', e)
    }
}
