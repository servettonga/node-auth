import { authentication, isAdmin } from '#services/userService.js';
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
export async function auth(req, res, next, checkAdmin = false) {
    try {
        const token = req.header('authorization');
        const response = await authentication(token);
        if (!response.error) {
            if (checkAdmin && !await isAdmin(response.userId)) {
                return writeJsonResponse(res, 401, {
                    error: {
                        type: 'authentication_error',
                        message: 'Unauthorized - Admin access required'
                    }
                });
            }
            res.locals.auth = {
                userId: response.userId
            };
            next();
        } else {
            writeJsonResponse(res, 401, {
                error: {
                    type: 'authentication_error',
                    message: 'Unauthorized - Authorization required'
                }
            });
        }
    } catch (error) {
        /* istanbul ignore next */
        logger.warn(`Internal Server Error - Authentication error: ${ error.message }`);
        writeJsonResponse(res, 500, {
            error: {
                type: 'internal_server_error',
                message: error.message
            }
        });
    }
}

export async function authAdmin(req, res, next) {
    return await auth(req, res, next, true);
}
