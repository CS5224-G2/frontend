export type LoginValues = {
  email: string
  password: string
}

export type AuthUser = {
  id: string
  email: string
  role: 'user' | 'admin' | 'business'
}

export type AuthResult = {
  accessToken: string
  user: AuthUser
}

export async function loginUser(values: LoginValues): Promise<AuthResult> {
  const email = values.email.trim().toLowerCase()
  const password = values.password

  if (!email) throw new Error('Email is required.')
  if (!password) throw new Error('Password is required.')

  // Simulate network latency
  await new Promise((r) => setTimeout(r, 600))

  const role: AuthUser['role'] =
    email === 'admin@cyclink.com'
      ? 'admin'
      : email === 'business@cyclink.com'
        ? 'business'
        : 'user'

  return {
    accessToken: 'mock-token-' + role,
    user: { id: 'mock-' + role, email, role },
  }
}
