import cacheExternal from "#utils/cacheExternal.js";
import * as db from '#utils/db.js';
import { createServer } from '#utils/server.js';
import logger from '#utils/logger.js';
import config from '#config'

try {
    await db.setup();
    await cacheExternal.open();
    const server = createServer();
    server.listen(config.serverPort, () => {
        logger.info(`Server is running on port ${config.serverPort}`)
    })
} catch (error) {
    logger.error(`Error: ${error}`)
}
