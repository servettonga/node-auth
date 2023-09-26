import { getUsers } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';

/**
 * Returns an array of users
 * @param {express.Request} req Request
 * @param {express.Response} res Response
 * @return {Promise<{User}>}
 */
export async function users(req, res) {
    try {
        const allowed = ['username', 'email', 'admin', 'active', 'limit'];
        const query = Object.keys(req.query)
            .filter(key => allowed.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.query[key];
                return obj;
            }, {});
        if (Object.keys(query).length === 0) {
            return writeJsonResponse(
                res,
                404,
                { message: 'Invalid or empty query' }
            );
        }
        return writeJsonResponse(res, 200, await getUsers(req.query));
    } catch (error) {
        /* istanbul ignore next */
        logger.warn('Internal Server Error - /users ', error.message);
        writeJsonResponse(res, 500, {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error'
            }
        });
    }
}
