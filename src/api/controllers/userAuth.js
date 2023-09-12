import { authentication } from '#services/userService.js';
import { writeJsonResponse } from '#utils/express.js';
import logger from '#utils/logger.js';


export async function auth(req, res, next) {
    try {
        const token = req.header('authorization');
        const response = await authentication(token);
        if (!response.error) {
            res.locals.auth = {
                userId: response.userId
            }
            next();
        } else {
            writeJsonResponse(res, 401, response);
        }

    }
    catch (error) {
        /* istanbul ignore next */
        writeJsonResponse(res, 500, {
            error: {
                type: 'internal_server_error',
                message: 'Internal Server Error'
            }
        })
    }

}