/* istanbul ignore file */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import config from '#config';
import logger from '#utils/logger.js';

/**
 * @namespace Database
 */

mongoose.Promise = global.Promise;
mongoose.set('debug', process.env.DEBUG !== undefined);

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: config.mongo.autoIndex,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
}

let mongoServer;

/**
 * Setup a database connection
 * @memberof Database
 * @async
 * @method
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function setup() {
    try {
        if (config.mongo.url === 'inmemory') {
            logger.debug('Connecting to in-memory database');
            if (!mongoServer) {
                mongoServer = await MongoMemoryServer.create();
            }
            const mongoUrl = mongoServer.getUri();
            await mongoose.connect(mongoUrl, options);
            logger.debug('Connected to in-memory database');
        }
        else {
            logger.debug(`Connecting to ${config.mongo.url}`);
            await mongoose.connect(config.mongo.url, options);
        }

        mongoose.connection.on('connected', () => {
            logger.debug('Connected to database');
        })

        mongoose.connection.on('disconnected', () => {
            logger.debug('Disconnected from database');
        })

        mongoose.connection.on('error', (err) => {
            logger.error('Error connecting to database', err);
            if (err.name === 'MongoNetworkError') {
                setTimeout(async () => {
                    mongoose.connect(config.mongo.url, options).catch(() => { });
                }, 5000)
            }
        })
    } catch (err) {
        logger.error(`db.open: ${err}`);
        throw err;
    }
}

/**
 * Disconnect from the database
 * @memberof Database
 * @async
 * @method
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function teardown() {
    try {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
        logger.debug('Disconnected from database');
    } catch (err) {
        logger.error(`db.close: ${err}`);
        throw err;
    }
}
