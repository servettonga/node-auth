import { writeJsonResponse } from '../../utils/express.js';

export async function getUser(req, res, next) {
    const userId = res.locals.auth.userId
    writeJsonResponse(res, 200, {
        message: `User information for ${userId}`
    })
}
