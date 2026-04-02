import { UserActions } from '@store/features/user';
import AxiosRequest, { routes } from '@helpers/api';
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@helpers/api', () => ({
    __esModule: true,
    default: jest.fn(),
    routes: { login: '/login' },
}));

describe('login thunk', () => {
    it('dispatches fulfilled on success', async () => {
        const mockResponse = {
            accessKey: 'any-access-key',
            secretKey: 'any-secret-key',
        };

        const mockAxios = { post: jest.fn(() => Promise.resolve({ data: mockResponse })) };

        // Make AxiosRequest return our fake axios instance
        (AxiosRequest as unknown as jest.Mock).mockReturnValue({ axios: mockAxios });

        const thunk = UserActions.login({ email: 'abc@email.com', password: '123' });
        const dispatch = jest.fn();
        const getState = jest.fn();

        const result = await thunk(dispatch, getState, undefined);
        console.log("Result success:", result);

        expect(result.type).toBe('user/login/fulfilled');
        expect(result.payload).toHaveProperty('accessKey', 'any-access-key');
        expect(result.payload).toHaveProperty('secretKey', 'any-secret-key');
    });

    it('dispatches rejected on error', async () => {
        const mockAxios = {
            post: jest.fn(() =>
                Promise.reject({
                    response: { data: { error: { message: 'Unauthorized' } } },
                })
            ),
        };

        // Make AxiosRequest return our fake axios instance
        (AxiosRequest as unknown as jest.Mock).mockReturnValue({ axios: mockAxios });

        const thunk = UserActions.login({ email: 'abc@email.com', password: 'wrong' });
        const dispatch = jest.fn();
        const getState = jest.fn();

        const result = await thunk(dispatch, getState, undefined);
        console.log("Result error:", result);

        expect(result.type).toBe('user/login/rejected');
        expect(result.meta).toHaveProperty('rejectedWithValue', true);
        expect(result.meta).toHaveProperty('requestStatus', 'rejected');

    });
});
