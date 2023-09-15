import User from '#models/user.js'
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
 * @return {Promise<{response: {message: string}}>}
 */
export async function registerUser(req, res, next) {
    try {
        const user = await createUser(req.body)
        writeJsonResponse(res, 200, {
            response: `User's created: ${req.body.username}`
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
