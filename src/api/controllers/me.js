import { authentication } from '#services/userService.js';
import { getUser } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

export async function whoAmI(req, res) {
    try {
        const user = await authentication(req.header('Authorization'));
        if (!user) {
            writeJsonResponse(res, 401, { error: 'Unauthorized request' });
        }
        const userData = await getUser(user.userId);
        if (userData) {
            writeJsonResponse(res, 200, userData);
        } else {
            writeJsonResponse(res, 404, { error: 'User\'s not found' });
        }
    } catch (error) {
        logger.warn('User information error');
        writeJsonResponse(res, 500, {
            error: 'Internal Server Error',
            message: error
        });
    }
}
