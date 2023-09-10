import NodeCache from "node-cache";

import config from '#config'


class CacheLocal {
    static #instance;
    static #isInternalConstructing = false;
    #cache;

    constructor(ttlSeconds) {
        if (!CacheLocal.#isInternalConstructing) {
            throw new TypeError('PrivateConstructor is not constructable');
        }
        CacheLocal.#isInternalConstructing = false;
        this.#cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        })
    }

    static getInstance() {
        CacheLocal.#isInternalConstructing = true;
        if (!CacheLocal.#instance) {
            CacheLocal.#instance = new CacheLocal(config.localCacheTtl);
        }
        return CacheLocal.#instance;
    }

    get(key) {
        return this.#cache.get(key)
    }

    set(key, value) {
        this.#cache.set(key, value)
    }

}

export default CacheLocal.getInstance()
