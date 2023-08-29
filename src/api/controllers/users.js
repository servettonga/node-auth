import { writeJsonResponse } from '#utils/express.js';

export async function getUsers(req, res) {
    const name = req.query.username || 'World'
    writeJsonResponse(res, 200, {
        message: `Hello, ${name}!`
    })
}
