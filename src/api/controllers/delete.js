import { authentication, deleteUser, getUser, getUserById } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';

export async function delUser(req, res) {
    try {
        const header = await authentication(req.header('Authorization'));
        const admin = await getUserById(header.userId);
        const userToDelete = await getUser(req.query.username);
        if (userToDelete.error) {
            return writeJsonResponse(res, 404, {message: 'User not found'});
        }
        if(admin.username === userToDelete.username){
            return writeJsonResponse(res, 400, {message: 'Cannot delete own user'});
        }
        const result = await deleteUser(userToDelete.username);
        if(result && result.error){
            return writeJsonResponse(res, 500, result.error);
        } else {
            return writeJsonResponse(res, 200, {message: 'User deleted successfully'});
        }
    } catch (error) {
        /* istanbul ignore next */
        logger.warn(`Internal Server Error - /delete: ${error.message}`);
        writeJsonResponse(res, 500, {
            type: 'internal_server_error',
            message: error.message
        });
    }
}
