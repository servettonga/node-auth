import { writeJsonResponse } from '#utils/express.js';
import logger from "#utils/logger.js";
import { createUser } from '#services/userService.js'

/**
 * Register a user to the system
 * @method
 * @async
 * @param {express.Request} req Request
 * @param {express.Response} res Response
 * @param {express.NextFunction} next NextFunction
 * @return {Promise<{userId: string} | {error: string}>}
 */
export async function registerUser(req, res, next) {
    try {
        const { username, email, password } = req.body;
        const response = await createUser(username, email, password);
        const stringified = JSON.stringify(response).toLowerCase();
        if (!response.error) {
            writeJsonResponse(
                res,
                200,
                {userId: response.userId, token: response.token},
                {'X-Expires-After': response.expireAt.toISOString()}
            )
        } else if (stringified.includes('username')) {
            writeJsonResponse(res, 409, {
                error: 'Username\'s already registered',
            });
        } else if (stringified.includes('email')) {
            writeJsonResponse(res, 409, {
                error: 'Email\'s already registered',
            });
        } else if (stringified.includes('required')) {
            writeJsonResponse(res, 400, {
                error: 'Required fields can not be blank',
            });
        } else {
            writeJsonResponse(res, 500, {
                error: 'internal_server_error',
                message: 'Internal Server Error'
            });
        }
    } catch (error) {
        logger.warn('User registration error');
        writeJsonResponse(res, 500, {
            error: 'Internal Server Error',
            message: error
        });
    }
}
