import * as db from '#utils/db.js';
import { createServer } from '#utils/server.js';
import logger from '#utils/logger.js';

try {
    db.setup();
    const server = await createServer();
    server.listen(3000, () => {
        logger.info(`Server is running on port 3000`)
    })
}
catch (error) {
    logger.info(`Error: ${error}`)
}
