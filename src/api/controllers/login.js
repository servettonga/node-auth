import { login } from "#services/userService.js";
import { writeJsonResponse } from "#utils/express.js";


export async function loginUser(req, res) {
    const { username, password } = req.body;

    try {
        const tokenRequest =  await login(username, password);
        if (!tokenRequest.error) {
            const { userId, token, expireAt } = tokenRequest;
            writeJsonResponse(
                res,
                200,
                {userId, token},
                {'X-Expires-After': expireAt.toISOString()}
            );
        } else {
            switch (tokenRequest.error.type) {
                case 'invalid_request':
                    writeJsonResponse(res, 400, tokenRequest);
                    break;
                case 'invalid_credentials':
                    writeJsonResponse(res, 404, tokenRequest);
                    break;
                default:
                    writeJsonResponse(res, 500, tokenRequest);

            }
        }
    } catch (e) {
        writeJsonResponse(
            res,
            500,
            {error: {type: 'internal_server_error', message: 'Internal Server Error'}}
        );
    }

}
