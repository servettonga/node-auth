/* istanbul ignore file */
import config from '#config';
import NodeCache from 'node-cache';

/**
 * @class CacheLocal
 * Get an instance of local cache
 */
class CacheLocal {
    static #instance;
    static #isInternalConstructing = false;
    #cache;

    /**
     * @constructor
     * @param {int} ttlSeconds TTL value in seconds
     */
    constructor(ttlSeconds) {
        if (!CacheLocal.#isInternalConstructing) {
            throw new TypeError('PrivateConstructor is not constructable');
        }
        CacheLocal.#isInternalConstructing = false;
        this.#cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        });
    }

    /**
     * Get an instance of local cache
     * @returns {NodeCache}
     */
    static getInstance() {
        CacheLocal.#isInternalConstructing = true;
        if (!CacheLocal.#instance) {
            CacheLocal.#instance = new CacheLocal(config.localCacheTtl);
        }
        return CacheLocal.#instance;
    }

    /**
     * Get a value by key
     * @param key Key to be returned
     * @returns {object}
     */
    get(key) {
        return this.#cache.get(key);
    }

    /**
     * Set a key, value pair
     * @param key Key to be stored
     * @param value Value to be stored
     */
    set(key, value) {
        this.#cache.set(key, value);
    }

    /**
     * Checks whether the cache has a key
     * @param key Key to check
     * @returns {boolean}
     */
    has(key) {
        return this.#cache.has(key);
    }

    /**
     * Deletes a key from the cache
     * @param key Key to be deleted
     * @returns {Number} Returns number of deleted entries
     */
    del(key) {
        return this.#cache.del(key);
    }

}

/** An instance of local cache
 * @returns {NodeCache}
 * */
export default CacheLocal.getInstance();
