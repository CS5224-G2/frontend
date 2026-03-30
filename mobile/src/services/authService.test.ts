jest.mock('./httpClient', () => ({
  httpClient: { post: jest.fn() },
}));

jest.mock('./secureSession', () => ({
  saveSession: jest.fn(),
}));

import { httpClient } from './httpClient';
import { loginUser, registerUser } from './authService';

const mockPost = httpClient.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('loginUser()', () => {
  it('maps BackendAuthResponse to AuthResult camelCase shape', async () => {
    mockPost.mockResolvedValueOnce({
      access_token: 'tok-abc',
      refresh_token: 'ref-xyz',
      expires_in: 3600,
      user: {
        id: 'u1',
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@test.com',
        onboarding_complete: true,
        role: 'user',
      },
    });

    const result = await loginUser({ email: 'alice@test.com', password: 'pass123' });

    expect(result.accessToken).toBe('tok-abc');
    expect(result.refreshToken).toBe('ref-xyz');
    expect(result.user.firstName).toBe('Alice');
    expect(result.user.lastName).toBe('Smith');
    expect(result.user.fullName).toBe('Alice Smith');
    expect(result.user.email).toBe('alice@test.com');
    expect(result.user.onboardingComplete).toBe(true);
    expect(mockPost).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ email: 'alice@test.com', client: 'mobile_app' }),
    );
  });

  it('normalises email to lowercase before posting', async () => {
    mockPost.mockResolvedValueOnce({
      access_token: 't', refresh_token: 'r', expires_in: 3600,
      user: { id: 'u2', first_name: 'Bob', last_name: 'Lee', email: 'bob@test.com', onboarding_complete: false, role: 'user' },
    });
    await loginUser({ email: '  BOB@TEST.COM  ', password: 'pw' });
    expect(mockPost).toHaveBeenCalledWith('/auth/login', expect.objectContaining({ email: 'bob@test.com' }));
  });

  it('throws when email is missing', async () => {
    await expect(loginUser({ email: '', password: 'pw' })).rejects.toThrow('Email and password are required.');
  });
});

describe('registerUser()', () => {
  it('posts to /auth/register and returns mapped result', async () => {
    mockPost.mockResolvedValueOnce({
      access_token: 'tok-reg', refresh_token: 'ref-reg', expires_in: 3600,
      user: { id: 'u3', first_name: 'Carol', last_name: 'Jones', email: 'carol@test.com', onboarding_complete: false, role: 'user' },
    });

    const result = await registerUser({
      firstName: 'Carol', lastName: 'Jones', email: 'carol@test.com',
      password: 'Password1!', confirmPassword: 'Password1!', agreedToTerms: true,
    });

    expect(result.user.firstName).toBe('Carol');
    expect(mockPost).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ first_name: 'Carol', last_name: 'Jones', client: 'mobile_app' }),
    );
  });

  it('throws when passwords do not match', async () => {
    await expect(registerUser({
      firstName: 'X', lastName: 'Y', email: 'x@y.com',
      password: 'abc', confirmPassword: 'xyz', agreedToTerms: true,
    })).rejects.toThrow('Passwords do not match.');
  });
});
