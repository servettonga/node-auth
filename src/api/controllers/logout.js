import { authentication, logoutUser } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

export async function logout(req, res) {
    try {
        const header = req.header('Authorization');
        const user = await authentication(header);
        const token = await logoutUser(user.userId);
        const expire = new Date();
        res.locals.auth = {};
        writeJsonResponse(
            res,
            200,
            { userId: user.userId, token },
            { 'X-Expires-After': expire.toISOString() }
        );
    } catch (error) {
        logger.warn(`User logout error: ${ error.message }`);
        writeJsonResponse(res, 500, {
            type: 'internal_server_error',
            message: 'Internal Server Error'
        });
    }
}
