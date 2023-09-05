import User from '#models/user.js'
import { writeJsonResponse } from '#utils/express.js';
import logger from "#utils/logger.js";

export async function registerUser(req, res, next) {
    try {
        const user = new User(req.body);
        await user.save()
        writeJsonResponse(res, 200, {
            response: `User's created: ${user.username}`
        })
    } catch (error) {
        if ('username' in error.keyPattern) {
            writeJsonResponse(res, 409, {
                error: 'Username\'s already registered',
            })
        } else if ('email' in error.keyPattern) {
            writeJsonResponse(res, 409, {
                error: 'Email\'s already registered',
            })
        }
        else {
            writeJsonResponse(res, 500, {
                error: 'Internal Server Error',
                message: error.messge
            })
        }
    }
}
