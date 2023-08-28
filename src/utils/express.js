export function writeJsonResponse(res, code, payload, headers) {
    const data = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload;
    res
        .status(code)
        .set(headers)
        .send(data)
}
