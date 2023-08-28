import authentication from '../services/user.js'
import { writeJsonResponse } from '../../utils/express.js';

export async function auth(req, res, next) {
    try {
        const token = req.header('authorization')
        const response = await authentication(token)
        if (!response.error) {
            res.locals.auth = {
                userId: response.userId
            }
            next()
        } else {
            writeJsonResponse(res, 401, response)
        }

    }
    catch (error) {
        writeJsonResponse(res, 500, {
            error: {
                type: 'InternalServerError',
                message: error.message
            }
        })
    }

}
