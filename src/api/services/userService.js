import config from '#config';
import User from '#models/user.js';
import cacheExternal from '#utils/cacheExternal.js';
import cacheLoad from '#utils/cacheLoad.js';
import logger from '#utils/logger.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';

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
        };
    } catch (error) {
        logger.warn(`Internal Server Error - JWT configuration error: ${ error.message }`);
    }
}

const jwtCfg = await getJwtConfig();

/**
 * Create authentication token for user by User ID
 * @memberof UserService
 * @method
 * @async
 * @param {string} userId User ID
 * @param {boolean} renew Force creating new token
 * @return {Promise<{expireAt: Date, token: (Object|*)}|{error: string}>}
 */

/* istanbul ignore next */
export async function createAuthToken(userId, renew) {
    try {
        let cachedToken;
        let token;
        if (!renew) {
            cachedToken = await cacheExternal.getProp(userId);
        }
        if (userId) {
            token = cachedToken ? cachedToken : await jwt.sign({ userId }, jwtCfg.privateSecret, jwtCfg.signOptions);
        }
        if (token) {
            const expireAfter = 2 * 604800;
            const expireAt = new Date();
            expireAt.setSeconds(expireAt.getSeconds() + expireAfter);
            await cacheExternal.setProp(token, userId, expireAfter);
            await cacheExternal.setProp(userId, token, expireAfter);
            return { token, expireAt };
        }
        return { error: 'Token couldn\'t be created' };
    } catch (error) {
        logger.warn(`Internal Server Error - createAuthToken: ${ error.message }`);
    }
}

/**
 * Login user into the system and return token
 * @memberof UserService
 * @method
 * @async
 * @param {string} username Username
 * @param {string} password Password
 * @return {Promise<{expireAt: Date, userId: string, token: (Object|*)}|{error: {type: string, message: string}}>}
 */
export async function loginUser(username, password) {
    try {
        if (!username || !password) {
            return { error: { type: 'invalid_request', message: 'Username or password fields can\'t be blank' } };
        }
        const cachedUser = cacheLoad.get(username);
        const user = cachedUser ? cachedUser : await User.findOne({ username: username });
        const passwordValid = user ? await user.comparePassword(password) : undefined;
        const authToken = user ? await createAuthToken(user._id.toString(), true) : undefined;
        if (!passwordValid || !user) {
            return { error: { type: 'invalid_credentials', message: 'Invalid username or password' } };
        }
        if (passwordValid && authToken.token) {
            cacheLoad.set(username, user);
            return { userId: user._id.toString(), token: authToken.token, expireAt: authToken.expireAt };
        }
    } catch (error) {
        /* istanbul ignore next */
        logger.warn('Internal Server Error - loginUser: ', error.message);
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - Login Error ',
                reason: error.message
            }
        };
    }
}

/**
 * Create a new User
 * @memberof UserService
 * @method
 * @async
 * @param {string} username Unique username
 * @param {string} email Unique email
 * @param {string} password At least 8 character password
 * @return {Promise{User} | {error: {type: string, message: string}}>}
 */
export async function createUser(username, email, password) {
    try {
        let response;
        if (username && email && password) {
            const newUser = new User({ username, email: email.toLowerCase(), password });
            response = await newUser.save();
        } else {
            return {
                error: {
                    type: 'required_field_error',
                    message: 'Required fields can not be blank'
                }
            };
        }
        if (response) {
            return await loginUser(username, password);
        }
    } catch (error) {
        if (error.code === 11000 || error.errors) {
            return {
                error: {
                    type: 'validation_error',
                    message: error.message
                }
            };
        }
        /* istanbul ignore next */
        logger.warn('Internal Server Error - createUser: ', error.message);
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - User couldn\'t be created'
            }
        };
    }
}

/**
 * Update user information
 * @memberof UserService
 * @method
 * @async
 * @param {Object} user User to be updated
 * @param {Object} update Information to be updated
 * @return {Promise<{expireAt: Date, userId: string, token: (Object|*)}|{error: {type: string, message: string}}>} */
export async function updateUser(user, update) {
    try {
        if (Object.keys(update).length === 0) {
            return {
                error: {
                    type: 'validation_error',
                    message: 'Nothing found to update'
                }
            };
        }
        const validFields = Object.keys(User.schema.obj); // User schema fields
        if (!Object.keys(update).every(field => validFields.includes(field))) {
            return {
                error: {
                    type: 'validation_error',
                    message: 'Invalid fields'
                }
            };
        }
        const query = await User.findByIdAndUpdate(user.userId, update, { new: true });
        if (!query) {
            return {
                error: {
                    type: 'not_found_error',
                    message: 'User not found'
                }
            };
        }
        const passwordChanged = Object.keys(update).includes('password');
        let authToken = await createAuthToken(user.userId, passwordChanged);
        if (passwordChanged && query) {
            cacheLoad.del(query.username);
        }
        if (query) {
            return { userId: user.userId, token: authToken.token, expireAt: authToken.expireAt };
        }
    } catch (error) {
        if (Object.keys(error.keyPattern).includes('email')) {
            return {
                error: {
                    type: 'duplicate_key',
                    message: 'Email is already in use'
                }
            };
        }
        /* istanbul ignore next */
        logger.warn('Internal Server Error - Update User', error.message);
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - User couldn\'t be updated'
            }
        };
    }
}

/**
 * Delete a user from the system
 * @memberof UserService
 * @method
 * @async
 * @param {string} username User to delete
 * @return {Promise<{userId: Object} | {error: {type: string, message: string}}>} Deleted user
 */
export async function deleteUser(username) {
    try {
        return await User.findOneAndDelete({ username });
    } catch (error) {
        /* istanbul ignore next */
        logger.warn(`Internal Server Error - deleteUser: ${ error.message }`);
        return {
            error: {
                message: error.message
            }
        };
    }
}

/**
 * Get current user
 * @memberof UserService
 * @method
 * @async
 * @param {string} userId User ID to get information for
 * @returns {Promise<{error: {type: string, message: string, error}}|Query<Object>}
 */
export async function getUserById(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                error: {
                    type: 'not_found_error',
                    message: 'User not found'
                }
            };
        }
        return user;
    } catch (error) {
        /* istanbul ignore next */
        logger.warn('Internal Server Error - getUserById: ', error.message);
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - User could not be retrieved'
            }
        };
    }
}

/**
 * Get user information
 * @memberof UserService
 * @method
 * @async
 * @param {string} username Username to get information for
 * @returns {Promise<{error: {type: string, message: string, error}}|Query<Object>}
 */
export async function getUser(username) {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return {
                error: {
                    type: 'not_found_error',
                    message: 'User not found'
                }
            };
        }
        return user;
    } catch (error) {
        /* istanbul ignore next */
        logger.warn('Internal Server Error - getUser: ', error.message);
        return {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - User could not be retrieved'
            }
        };
    }
}

/**
 * Authenticate a token
 * @memberof UserService
 * @method
 * @async
 * @param {string} bearerToken Token to be verified
 * @return {Promise<{userId: string} | {error: {type: string, message: string}}>}
 * @throws
 */
export async function authentication(bearerToken) {
    try {
        const token = bearerToken.replace('Bearer ', '');
        const userId = await cacheExternal.getProp(token);
        return userId ? { userId } : jwt.verify(token, jwtCfg.publicKey, jwtCfg.verifyOptions, async (err, decoded) => {
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
                };

            }
        });
    } catch (error) {
        /* istanbul ignore next */
        logger.warn(`Authentication failed: ${ error.message }`);
        throw error;
    }
}

/**
 * Expire the token and remove it from cache
 * @memberof UserService
 * @method
 * @async
 * @param {string} userId
 * @returns void
 * @throws
 */
export async function logoutUser(userId) {
    try {
        const token = await cacheExternal.getProp(userId);
        await cacheExternal.delProp(token);
        await cacheExternal.delProp(userId);
        return await jwt.sign({ userId }, jwtCfg.privateSecret, { algorithm: 'RS256', expiresIn: 0 });
    } catch (error) {
        /* istanbul ignore next */
        logger.warn(`Internal Server Error - Logout failure ${ error.message }`);
        throw error;
    }
}

/**
 * Checks if the user is authorized
 * @param {String} userId User ID to check authorization for
 * @return {Promise<Object | {error: {type: string, message: string}}>}
 */
export async function isAdmin(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                error: {
                    type: 'not_found_error',
                    message: 'User not found'
                }
            };
        }
        return user.admin;
    } catch (error) {
        /* istanbul ignore next */
        logger.warn(`Internal Server Error - isAdmin: ${ error.message }`);
        throw error;
    }
}
