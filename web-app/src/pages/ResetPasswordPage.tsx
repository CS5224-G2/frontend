import { FormEvent, useState } from 'react'
import { ArrowLeft, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/authService'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!token) {
      setError('This reset link is missing a valid token. Request a new email and try again.')
      return
    }

    if (!password.trim()) {
      setError('New password is required.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const message = await resetPassword(token, password)
      setSuccessMessage(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.')
    } finally {
      setLoading(false)
    }
  }

  const missingToken = !token

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 text-white shadow-2xl shadow-black/30 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.2),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_30%)]" />
            <div className="relative h-full">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>

              <div className="mt-12 max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Secure reset</p>
                <h1 className="mt-4 text-4xl font-black leading-tight text-white">
                  Set a new password and get back on the road.
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  This form uses the token from your email link. Once the password is updated, the token should no longer be reusable.
                </p>

                <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    {missingToken ? (
                      <ShieldAlert className="mt-0.5 h-6 w-6 text-amber-300" />
                    ) : (
                      <KeyRound className="mt-0.5 h-6 w-6 text-sky-300" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {missingToken ? 'Reset link required' : 'Token detected'}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {missingToken
                          ? 'Open this page from the reset email, or request a fresh reset link if the current one expired.'
                          : 'If this link expires before you submit, request a new email from the forgot-password page.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white px-6 py-8 text-slate-900 sm:px-10 sm:py-12">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">New password</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Reset your password</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Choose a new password for your account. You&apos;ll use it the next time you sign in.
              </p>

              {successMessage ? (
                <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="text-base font-bold text-emerald-900">Password updated</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-800">{successMessage}</p>
                    </div>
                  </div>
                  <Link
                    to="/login"
                    className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    Continue to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      New password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                      placeholder="Enter a new password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                      placeholder="Re-enter the new password"
                    />
                  </div>

                  {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={loading || missingToken}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Resetting password…' : 'Reset password'}
                  </button>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                    Need a fresh link?{' '}
                    <Link to="/forgot-password" className="font-semibold text-primary-700 hover:text-primary-800">
                      Request another reset email
                    </Link>
                    .
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
