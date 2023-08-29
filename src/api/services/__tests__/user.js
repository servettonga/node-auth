import { authentication } from '#services/user.js';


describe('authentication', () => {
    it('should resolve with user', async () => {
        const response = await authentication('fakeToken');
        expect(response).toEqual({ userId: 'fakeUserId' });
    })

    it('should reject with error', async () => {
        const response = await authentication('invalidToken');
        expect(response).toEqual({ error: { type: 'Unauthorized', message: 'Invalid token' } });
    })
})
