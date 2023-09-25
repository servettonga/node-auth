import { authentication, getUserById } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

export async function whoAmI(req, res) {
    try {
        const user = await authentication(req.header('Authorization'));
        const userData = await getUserById(user.userId);
        if (!userData) {
            /* istanbul ignore next */
            writeJsonResponse(res, 404, { error: 'User\'s not found' });
        }
        writeJsonResponse(res, 200, userData);
    } catch (error) {
        /* istanbul ignore next */
        logger.warn('Internal Server Error - /me: ', error.message);
        writeJsonResponse(res, 500, {
            type: 'internal_server_error',
            message: error.message
        });
    }
}
