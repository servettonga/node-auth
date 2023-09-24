import { authentication, updateUser } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

export async function update(req, res) {
    try {
        const user = await authentication(req.header('Authorization'));
        const allowed = ['email', 'password'];
        const update = Object.keys(req.body)
            .filter(key => allowed.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});
        if (Object.keys(update).length === 0) {
            writeJsonResponse(
                res,
                404,
                { message: 'Nothing found to update' }
            );
        }
        const response = await updateUser(user, update);
        if (response && !response.error) {
            const { userId, token, expireAt } = response;
            writeJsonResponse(
                res,
                200,
                { userId, token },
                { 'X-Expires-After': expireAt.toISOString() }
            );
        }
    } catch (error) {
        logger.warn('User update error');
        writeJsonResponse(res, 500, {
            error: 'Internal Server Error',
            message: error.message
        });
    }
}
