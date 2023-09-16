import * as r from 'redis';
import redisMock from 'redis-mock';

import config from '#config';
import logger from '#utils/logger.js';

const redis = config.redisUrl === 'redis-mock' ? redisMock : r;

class cacheExternal {
    static #instance;
    static #initialConnection = false;
    #client;

    /**
     * @constructor
     */
    constructor() {
        if (!cacheExternal.#initialConnection) {
            throw new TypeError('PrivateConstructor is not constructable');
        }
        cacheExternal.#initialConnection = false;
    }

    /**
     * Get an instance of external cache
     * @returns {cacheExternal}
     */
    static getInstance() {
        cacheExternal.#initialConnection = true;
        if (!cacheExternal.#instance) {
            cacheExternal.#instance = new cacheExternal();
        }
        return cacheExternal.#instance;
    }

    /**
     * Connect to Redis database
     * @async
     * @returns {Promise<cacheExternal>}
     * @throws {Error}
     */
    async open() {
        try {
            this.#client = redis.createClient(config.redisUrl);
            const client = this.#client;
            await client.connect();

            client.on('connect', () => {
                logger.info('Redis: connected');
            })
            client.on('ready', () => {
                if (!cacheExternal.#initialConnection) {
                    cacheExternal.#initialConnection = false;
                }
                logger.info('Redis: ready');
            })
            client.on('reconnecting', () => {
                logger.info('Redis: reconnecting');
            })
            client.on('end', () => {
                logger.info('Redis: end');
            })
            client.on('disconnected', () => {
                logger.error('Redis: disconnected');
            })
            client.on('error', (err) => {
                logger.error(`Redis: error: ${err}`);
            })
        } catch (err) {
            logger.error(err);
        }
    }

    /**
     * Disconnect from the database
     * @returns {Promise<cacheExternal>}
     */
    async close() {
        try {
            return this.#client.quit();
        } catch (err) {
            logger.error(err);
        }
    }

    /**
     * Set a key, value pair
     * @async
     * @param key Key to be stored
     * @param value Value to be stored
     * @param expireAfter Lifetime of the key, value pair
     * @returns {Promise<string>} 'OK'
     * @throws {Error}
     */
    async setProp(key, value, expireAfter) {
        try {
            return this.#client
                .set(key, value, 'EX', expireAfter, (err, result) => {
                if (err) {
                    throw err;
                }
                if (result === false) {
                    throw Error('Redis connection error');
                }
                return result; // OK
                })
        } catch (err) {
            logger.error(`External cache set error: ${err}`);
        }
    }

    /**
     * Get a key, value pair
     * @async
     * @param key Key to be returned
     * @returns {Promise<object>}
     * @throws {Error}
     */
    async getProp(key) {
        try {
            return this.#client.get(key, (err, result) => {
                if (err) {
                    throw err;
                }
                if (result && result === false) {
                    throw Error('Redis connection error');
                }
                return result; // value
            })
        } catch (err) {
            logger.error(`External cache get error: ${err}`);
        }
    }

}

/** An instance of external cache
 * @returns {redis.RedisClient | redis-mock.RedisClient}
 * */
export default cacheExternal.getInstance();
