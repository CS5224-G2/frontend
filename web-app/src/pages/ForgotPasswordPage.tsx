import { FormEvent, useState } from 'react'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../services/authService'

const GENERIC_SUCCESS_MESSAGE = 'If an account exists, a reset link has been sent.'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState(GENERIC_SUCCESS_MESSAGE)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Email is required.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const responseMessage = await requestPasswordReset(normalizedEmail)
      setMessage(responseMessage || GENERIC_SUCCESS_MESSAGE)
    } catch {
      setMessage(GENERIC_SUCCESS_MESSAGE)
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white shadow-xl shadow-primary-900/10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative hidden overflow-hidden bg-primary-900 px-10 py-12 text-white lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.45),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.2),_transparent_35%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-primary-200">CycleLink</p>
                <h1 className="mt-6 max-w-sm text-4xl font-black leading-tight">
                  Reset access without exposing whether an account exists.
                </h1>
                <p className="mt-5 max-w-md text-sm leading-6 text-primary-100/90">
                  Submit the email tied to your account and we will send a time-limited reset link if the account is registered.
                </p>
              </div>

              <div className="relative rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Delivery window</p>
                    <p className="text-sm text-primary-100/80">The backend currently expires reset links after 15 minutes.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-10 sm:py-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>

            <div className="mt-10 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">Password reset</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">Forgot your password?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your email address and we&apos;ll send a reset link if we find a matching account.
              </p>

              {submitted ? (
                <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="text-base font-bold text-emerald-900">Check your inbox</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-800">{message}</p>
                      <p className="mt-3 text-sm leading-6 text-emerald-700">
                        Sent for: <span className="font-semibold">{email.trim().toLowerCase()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/login"
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      Return to sign in
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false)
                        setEmail('')
                        setError('')
                        setMessage(GENERIC_SUCCESS_MESSAGE)
                      }}
                      className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
                    >
                      Send another link
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                    />
                  </div>

                  {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Sending reset link…' : 'Send reset link'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
