import { authentication } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

/**
 * Authentication for the secured routes
 * @method
 * @async
 * @param {express.Request} req Request
 * @param {express.Response} res Response
 * @param {express.NextFunction} next NextFunction
 * @return {Promise<Object | {error: {type: string, message: string}}>}
 */
export async function auth(req, res, next) {
    try {
        const token = req.header('authorization');
        const response = await authentication(token);
        if (!response.error) {
            res.locals.auth = {
                userId: response.userId
            };
            next();
        } else {
            writeJsonResponse(res, 401, {
                error: {
                    type: "authentication_error",
                    cause: response.error
                }
            });
        }
    } catch (error) {
        /* istanbul ignore next */
        logger.warn(`Authentication error: ${error.message}`);
        writeJsonResponse(res, 500, {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error - Authentication failed'
            }
        });
    }
}
