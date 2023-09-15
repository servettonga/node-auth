/**
 * Write formatted JSON response
 * @param {express.Response} res Resource
 * @param {int} code Response Code
 * @param {JSON | object} payload Payload to send
 * @param headers Headers to set
 * @method
 * @returns void
 */
export function writeJsonResponse(res, code, payload, headers) {
    const data = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload;
    res
        .writeHead(code, {...headers, 'Content-Type': 'application/json'})
        .status(code)
        .end(data);
}
