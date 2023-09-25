import { createUser } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

export async function register(req, res) {
    try {
        const { username, email, password } = req.body;
        const response = await createUser(username, email, password);
        if (!response.error) {
            return writeJsonResponse(
                res,
                200,
                { userId: response.userId, token: response.token },
                { 'X-Expires-After': response.expireAt.toISOString() }
            );
        } else {
            switch (response.error.type) {
                case 'required_field_error':
                    writeJsonResponse(res, 400, { error: 'Required fields can not be blank' });
                    break;
                case 'validation_error':
                    writeJsonResponse(res, 409, response);
                    break;
                default:
                    writeJsonResponse(res, 500, response);
            }
        }
    } catch (error) {
        /* istanbul ignore next */
        logger.warn('Internal Server Error - /register', error.message);
        writeJsonResponse(res, 500, {
            type: 'internal_server_error',
            message: error.message
        });
    }
}
