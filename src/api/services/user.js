import bcrypt from "bcrypt";
import fs from 'fs';
import jwt from 'jsonwebtoken';

import config from '#config'
import logger from '#utils/logger.js'
import User from '#models/user.js';
import cacheLoad from "#utils/cacheLoad.js";


/* istanbul ignore next */
export async function jwtConfig(){
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
        throw Error('JWT configuration error')
    }
}

/* istanbul ignore next */
export async function createAuthToken(userId) {
    try {
        let token;
        if (userId) {
            const config = await jwtConfig();
            token = await jwt.sign({userId}, config.privateSecret, config.signOptions)
        }
        if (token) {
            const expireAfter = 2 * 604800;
            const expireAt = new Date();
            expireAt.setSeconds(expireAt.getSeconds() + expireAfter);
            return {token, expireAt};
        }
        return { error: 'Token couldn\'t be created' }
    } catch (err) {
        throw Error('Token couldn\'t be created')
    }
}

export async function login(username, password) {
    try {
        if (!username || !password) {
            return {error: { type: 'invalid_request', message: 'Username or password fields can\'t be blank' } }
        }
        let user;
        let passwordValid;
        let authToken;
        if (cacheLoad.has(username)) {
            user = cacheLoad.get(username);
        } else {
            user = await User.findOne({ username: username });
        }
        if (user) {
            passwordValid = await user.comparePassword(password);
            authToken = await createAuthToken(user._id.toString());
            cacheLoad.set(username, user);
            cacheLoad.set(user._id.toString(), user)
        }
        if (!passwordValid || !user) {
            return {error: { type: 'invalid_credentials', message: 'Invalid username or password' } }
        }
        if (passwordValid && authToken.token) {
            return {userId: user._id.toString(), token: authToken.token, expireAt: authToken.expireAt}
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

export async function createUser(user) {
    try {
        const newUser = new User(user);
        return await newUser.save()
    } catch (err) {
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - User couldn\'t be created'
            }
        }
    }
}

export async function authentication(bearerToken) {
    try {
        const config = await jwtConfig();
        const token = bearerToken.replace('Bearer ', '')
        return jwt.verify(token, config.publicKey, config.verifyOptions, (err, decoded) => {
            if (!err && decoded) {
                if (decoded.userId) {
                    return { userId: decoded.userId }
                }
            } else {
                throw Error(err)
            }
        })
    } catch (error) {
        return {
            error: {
                type: 'Unauthorized',
                message: 'Authorization Failed'
            }
        }
    }

}
