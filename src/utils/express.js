export function writeJsonResponse(res, code, payload) {
    const data = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload;
    res
        .status(code)
        .set('Content-Type', 'application/json')
        .end(data)
}
