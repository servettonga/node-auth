import cacheExternal from "#utils/cacheExternal.js";
import * as db from '#utils/db.js';
import { createServer } from '#utils/server.js';
import logger from '#utils/logger.js';

try {
    await cacheExternal.open();
    db.setup();
    const server = await createServer();
    server.listen(3000, () => {
        logger.info(`Server is running on port 3000`)
    })
} catch (error) {
    logger.error(`Error: ${error}`)
}
