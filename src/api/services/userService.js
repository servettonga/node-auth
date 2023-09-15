import fs from 'fs';
import jwt from 'jsonwebtoken';

import config from '#config';
import logger from '#utils/logger.js';
import User from '#models/user.js';
import cacheLoad from "#utils/cacheLoad.js";
import cacheExternal from "#utils/cacheExternal.js";

/** @namespace UserService */

/* istanbul ignore next */
export async function getJwtConfig() {
    try {
        return {
            privateSecret: { key: fs.readFileSync(config.privateKeyFile), passphrase: config.privateKeyPassphrase },
            signOptions: {
                algorithm: 'RS256',
                expiresIn: '14d'
            },
            publicKey: fs.readFileSync(config.publicKeyFile),
            verifyOptions: { algorithm: 'RS256' }
        }
    } catch (error) {
        logger.warn(`JWT configuration error: ${error.message}`);
    }
}

const jwtCfg = await getJwtConfig();

/**
 * Create authentication token for user by User ID
 * @method
 * @memberof UserService
 * @async
 * @param {string} userId User ID
 * @return {Promise<{expireAt: Date, token: (Object|*)}|{error: string}>}
 */
/* istanbul ignore next */
export async function createAuthToken(userId) {
    try {
        let cachedToken;
        let token;
        if (userId) {
            cachedToken = await cacheExternal.getProp(userId);
            token = cachedToken ? cachedToken : await jwt.sign({userId}, jwtCfg.privateSecret, jwtCfg.signOptions)
        }
        if (token) {
            const expireAfter = 2 * 604800;
            const expireAt = new Date();
            expireAt.setSeconds(expireAt.getSeconds() + expireAfter);
            await cacheExternal.setProp(token, userId, expireAfter);
            await cacheExternal.setProp(userId, token, expireAfter);
            return {token, expireAt};
        }
        return { error: 'Token couldn\'t be created' };
    } catch (err) {
        logger.warn(`Token couldn\'t be created: ${err}`);
    }
}

/**
 * Login user into the system and return token
 * @method
 * @memberof UserService
 * @async
 * @param {string} username Username
 * @param {string} password Password
 * @return {Promise<{expireAt: Date, userId: string, token: (Object|*)}|{error: {type: string, message: string}}>}
 */
export async function login(username, password) {
    try {
        if (!username || !password) {
            return {error: { type: 'invalid_request', message: 'Username or password fields can\'t be blank' } };
        }
        const cachedUser = cacheLoad.get(username);
        const user = cachedUser ? cachedUser : await User.findOne({username: username});
        const passwordValid = user ? await user.comparePassword(password) : undefined;
        const authToken = user ? await createAuthToken(user._id.toString()) : undefined;
        if (!passwordValid || !user) {
            return {error: { type: 'invalid_credentials', message: 'Invalid username or password' } };
        }
        if (passwordValid && authToken.token) {
            cacheLoad.set(username, user);
            return {userId: user._id.toString(), token: authToken.token, expireAt: authToken.expireAt};
        }
    } catch (err) {
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error'
            }
        }
    }
}

/**
 * Create a new User
 * @method
 * @async
 * @memberof UserService
 * @param {User} user User to be created
 * @return {Promise{User} | {error: {type: string, message: string}}>}
 */
export async function createUser(user) {
    try {
        const newUser = new User(user);
        return await newUser.save();
    } catch (err) {
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - User couldn\'t be created'
            }
        }
    }
}

/**
 * Authenticate a token
 * @method
 * @async
 * @memberof UserService
 * @param {string} bearerToken Token to be verified
 * @return {Promise<{userId: Object} | {error: {type: string, message: string}}>}
 */
export async function authentication(bearerToken) {
    try {
        const token = bearerToken.replace('Bearer ', '');
        const userId = await cacheExternal.getProp(token);
        return userId ? {userId} : jwt.verify(token, jwtCfg.publicKey, jwtCfg.verifyOptions, async (err, decoded) => {
            if (!err && decoded) {
                if (decoded.userId) {
                    const expireAfter = decoded.exp - Math.round((new Date()).valueOf() / 1000);
                    await cacheExternal.setProp(token, decoded.userId, expireAfter);
                    return { userId: decoded.userId };
                }
            } else {
                return {
                    error: {
                        type: 'Unauthorized',
                        message: 'Authorization Failed'
                    }
                }

            }
        })
    } catch (error) {
        logger.warn(`authentication failed: ${error}`);
    }
}
