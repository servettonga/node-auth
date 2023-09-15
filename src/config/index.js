import dotenvExtended from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';

/** @namespace Config */

/** Dotenv configuration */
const env = dotenvExtended.load({
    path: process.env.ENV_FILE,
    defaults: './config/.env.defaults',
    schema: './config/.env.schema',
    includeProcessEnv: true,
    silent: false,
    errorOnMissing: true,
    errorOnExtra: true,
})

const parseEnv = dotenvParseVariables(env);

const loggerLevel = {
    silent: 'silent',
    error: 'error',
    warn: 'warn',
    info: 'info',
    http: 'http',
    verbose: 'verbose',
    debug: 'debug',
    silly: 'silly'
}

/** Configuration for the application
 * @memberof Config
 * */
const config = {
    /** @type boolean */
    morganLogger: Boolean(parseEnv.MORGAN_LOGGER),
    /** @type boolean */
    morganBodyLogger: Boolean(parseEnv.MORGAN_BODY_LOGGER),
    /** @type {silent, error, warn, info, http, verbose, debug} */
    loggerLevel: loggerLevel[parseEnv.LOGGER_LEVEL],
    mongo: {
        /** @type string */
        url: parseEnv.MONGO_URL,
        /** @type boolean */
        useCreateIndex: Boolean(parseEnv.MONGO_USE_CREATE_INDEX),
        /** @type boolean */
        autoIndex: Boolean(parseEnv.MONGO_AUTO_INDEX)
    },
    /** @type string */
    privateKeyFile: parseEnv.PRIVATE_KEY_FILE,
    /** @type string */
    privateKeyPassphrase: parseEnv.PRIVATE_KEY_PASSPHRASE,
    /** @type string */
    publicKeyFile: parseEnv.PUBLIC_KEY_FILE,
    /** @type number */
    localCacheTtl: Number(parseEnv.LOCAL_CACHE_TTL),
    /** @type string */
    redisUrl: parseEnv.REDIS_URL,
    /** @type number */
    serverPort: parseEnv.SERVER_PORT
}

export default config;
