import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import LoginPage from './LoginPage'

function renderLoginPage() {
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        login: async () => {
          throw new Error('login not implemented in test stub')
        },
        logout: () => {},
      }}
    >
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('LoginPage', () => {
  it('renders the forgot-password link without crashing', () => {
    renderLoginPage()

    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password')
  })
})
