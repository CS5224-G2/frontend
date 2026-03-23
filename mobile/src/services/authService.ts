const MOCK_LATENCY_MS = 850;

export type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
};

type BackendLoginPayload = {
  email: string;
  password: string;
  remember_me: boolean;
  client: 'mobile_app';
};

type BackendRegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  agreed_to_terms: boolean;
  client: 'mobile_app';
};

type BackendAuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    onboarding_complete: boolean;
  };
};

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  onboardingComplete: boolean;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  requestPayload: BackendLoginPayload | BackendRegisterPayload;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const toLoginPayload = (values: LoginFormValues): BackendLoginPayload => ({
  email: normalizeEmail(values.email),
  password: values.password,
  remember_me: values.rememberMe,
  client: 'mobile_app',
});

const toRegisterPayload = (values: RegisterFormValues): BackendRegisterPayload => ({
  first_name: values.firstName.trim(),
  last_name: values.lastName.trim(),
  email: normalizeEmail(values.email),
  password: values.password,
  confirm_password: values.confirmPassword,
  agreed_to_terms: values.agreedToTerms,
  client: 'mobile_app',
});

const toAuthResult = (
  response: BackendAuthResponse,
  requestPayload: BackendLoginPayload | BackendRegisterPayload
): AuthResult => ({
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresIn: response.expires_in,
  user: {
    id: response.user.id,
    firstName: response.user.first_name,
    lastName: response.user.last_name,
    fullName: `${response.user.first_name} ${response.user.last_name}`.trim(),
    email: response.user.email,
    onboardingComplete: response.user.onboarding_complete,
  },
  requestPayload,
});

export async function loginUser(values: LoginFormValues): Promise<AuthResult> {
  const requestPayload = toLoginPayload(values);

  await wait(MOCK_LATENCY_MS);

  if (!requestPayload.email || !requestPayload.password) {
    throw new Error('Email and password are required.');
  }

  const mockResponse: BackendAuthResponse = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    user: {
      id: 'user_001',
      first_name: 'Alex',
      last_name: 'Rider',
      email: requestPayload.email,
      onboarding_complete: true,
    },
  };

  return toAuthResult(mockResponse, requestPayload);
}

export async function registerUser(values: RegisterFormValues): Promise<AuthResult> {
  const requestPayload = toRegisterPayload(values);

  await wait(MOCK_LATENCY_MS);

  if (
    !requestPayload.first_name ||
    !requestPayload.last_name ||
    !requestPayload.email ||
    !requestPayload.password ||
    !requestPayload.confirm_password
  ) {
    throw new Error('All fields are required.');
  }

  if (requestPayload.password !== requestPayload.confirm_password) {
    throw new Error('Passwords do not match.');
  }

  if (!requestPayload.agreed_to_terms) {
    throw new Error('You must accept the terms to continue.');
  }

  const mockResponse: BackendAuthResponse = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    user: {
      id: 'user_002',
      first_name: requestPayload.first_name,
      last_name: requestPayload.last_name,
      email: requestPayload.email,
      onboarding_complete: false,
    },
  };

  return toAuthResult(mockResponse, requestPayload);
}
