import { writeJsonResponse } from '#utils/express.js';

/**
 * Returns an array of users
 * @param {express.Request} req Request
 * @param {express.Response} res Response
 * @return {Promise<{User}>}
 */
export async function getUsers(req, res) {
    const name = req.query.username || 'World'
    writeJsonResponse(res, 200, {
        message: `Hello, ${name}!`
    })
}
