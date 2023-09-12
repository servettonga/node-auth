import * as r from 'redis';
import redisMock from 'redis-mock';

import config from '#config';
import logger from '#utils/logger.js';

const redis = config.redisUrl === 'redis-mock' ? redisMock : r;


class Cache {
    static #instance;
    static #initialConnection = false;
    #client;

    constructor() {
        if (!Cache.#initialConnection) {
            throw new TypeError('PrivateConstructor is not constructable');
        }
        Cache.#initialConnection = false;
    }

    static getInstance() {
        Cache.#initialConnection = true;
        if (!Cache.#instance) {
            Cache.#instance = new Cache();
        }
        return Cache.#instance;
    }

    async open() {
        try {
            Cache.#client = redis.createClient(config.redisUrl);
            const client = Cache.#client;

            client.on('connect', () => {
                logger.info('Redis: connected');
            })
            client.on('ready', () => {
                if (!Cache.#initialConnection) {
                    Cache.#initialConnection = false;
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

    async close() {
        try {
            return this.#client.quit();
        } catch (err) {
            logger.error(err);
        }
    }

    async setProp(key, value, expireAfter) {
        try {
            return await this.#client
                .set(key, value, (err, result) => {
                if (err) {
                    return err;
                }
                if (result === false) {
                    throw Error('Redis connection error');
                }
                return result;
                })
                .expire(key, expireAfter);
        } catch (err) {
            logger.error(err)
        }
    }

    async getProp(key) {
        try {
            return await this.#client.get(key, (err, result) => {
                if (err) {
                    return err;
                }
                if (result && result === false) {
                    throw Error('Redis connection error');
                }
                return result;
            })
        } catch (err) {
            logger.error(err);
        }
    }

}


export default Cache.getInstance();
