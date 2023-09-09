import dotenvExtended from 'dotenv-extended';
import dotenvParseVariables from 'dotenv-parse-variables';


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

const config = {
    morganLogger: Boolean(parseEnv.MORGAN_LOGGER),
    morganBodyLogger: Boolean(parseEnv.MORGAN_BODY_LOGGER),
    loggerLevel: loggerLevel[parseEnv.LOGGER_LEVEL],
    mongo: {
        url: parseEnv.MONGO_URL,
        useCreateIndex: Boolean(parseEnv.MONGO_USE_CREATE_INDEX),
        autoIndex: Boolean(parseEnv.MONGO_AUTO_INDEX)
    },
    privateKeyFile: parseEnv.PRIVATE_KEY_FILE,
    privateKeyPassphrase: parseEnv.PRIVATE_KEY_PASSPHRASE,
    publicKeyFile: parseEnv.PUBLIC_KEY_FILE
}

export default config;
