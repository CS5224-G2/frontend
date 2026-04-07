jest.mock('./httpClient', () => ({
  httpClient: { post: jest.fn() },
}));

jest.mock('./secureSession', () => ({
  saveSession: jest.fn(),
}));

jest.mock('../config/runtime', () => ({
  getApiBaseUrl: jest.fn(() => 'https://api.cyclelink.test'),
}));

import { httpClient } from './httpClient';
import { loginUser, registerUser, requestPasswordReset, resetPassword } from './authService';

const mockPost = httpClient.post as jest.Mock;
const originalFetch = global.fetch;
const mockFetch = jest.fn();

function createMockResponse({
  ok = true,
  status = 200,
  contentType = 'application/json',
  jsonData = {},
  textData = '',
}: {
  ok?: boolean;
  status?: number;
  contentType?: string;
  jsonData?: unknown;
  textData?: string;
}) {
  return {
    ok,
    status,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    json: jest.fn().mockResolvedValue(jsonData),
    text: jest.fn().mockResolvedValue(textData),
  } as unknown as Response;
}

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
});

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

  it('normalises invalid credential errors from the backend', async () => {
    const backendError = new Error('Invalid credentials');
    Object.assign(backendError, { status: 401 });
    mockPost.mockRejectedValueOnce(backendError);

    await expect(loginUser({ email: 'alice@test.com', password: 'wrong-pass' })).rejects.toThrow(
      'Wrong email or password',
    );
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

describe('requestPasswordReset()', () => {
  it('posts a normalized email to /auth/forgot-password', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        jsonData: { message: 'If an account exists, a reset token has been sent.' },
      }),
    );

    await expect(requestPasswordReset('  ALEX@EXAMPLE.COM  ')).resolves.toContain('reset token');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cyclelink.test/auth/forgot-password',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex@example.com' }),
      }),
    );
  });

  it('throws when email is missing', async () => {
    await expect(requestPasswordReset('')).rejects.toThrow('Email is required.');
  });
});

describe('resetPassword()', () => {
  it('posts the token and trimmed password to /auth/reset-password', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        jsonData: { message: 'Password reset successful.' },
      }),
    );

    await expect(resetPassword('  token-123  ', ' NewPassword123! ')).resolves.toContain('successful');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cyclelink.test/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'token-123', new_password: 'NewPassword123!' }),
      }),
    );
  });

  it('surfaces backend failure messages', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        ok: false,
        status: 400,
        contentType: 'text/plain',
        textData: 'Reset token expired.',
      }),
    );

    await expect(resetPassword('token-123', 'NewPassword123!')).rejects.toThrow('Reset token expired.');
  });

  it('throws when the token is missing', async () => {
    await expect(resetPassword('', 'NewPassword123!')).rejects.toThrow('Reset token is required.');
  });
});
