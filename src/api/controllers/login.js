import { loginUser } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

/**
 * Log in to the system
 * @method
 * @async
 * @param {express.Request} req Request
 * @param {express.Response} res Response
 * @param {express.NextFunction} next NextFunction
 * @return {Promise<{response: {message: string}}>}
 */
export async function login(req, res) {
    try {
        const { username, password } = req.body;
        const tokenRequest = await loginUser(username, password);
        if (!tokenRequest.error) {
            const { userId, token, expireAt } = tokenRequest;
            return writeJsonResponse(
                res,
                200,
                { userId, token },
                { 'X-Expires-After': expireAt.toISOString() }
            );
        } else {
            switch (tokenRequest.error.type) {
                case 'invalid_request':
                    writeJsonResponse(res, 400, tokenRequest);
                    break;
                case 'invalid_credentials':
                    writeJsonResponse(res, 404, tokenRequest);
                    break;
                default:
                    writeJsonResponse(res, 500, tokenRequest);
            }
        }
    } catch (error) {
        /* istanbul ignore next */
        logger.warn('Internal Server Error - /login', error.message);
        writeJsonResponse(
            res,
            500,
            {
                type: 'internal_server_error',
                message: error.message
            }
        );
    }

}
