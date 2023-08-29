export async function authentication(bearerToken) {
    const token = bearerToken.replace('Bearer ', '')

    if (token === 'fakeToken') {
        return { userId: 'fakeUserId' }
    }
    else {
        return {
            error: {
                type: 'Unauthorized',
                message: 'Invalid token'
            }
        }
    }

}
