import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BusinessNavbar from '../components/BusinessNavbar'
import Footer from '../components/Footer'
import {
  getBusinessLandingStats,
  type BusinessLandingStats,
} from '../services/businessService'

const offerings = [
  {
    emoji: '📍',
    title: 'Sponsored Waypoints',
    desc: 'Feature your hawker centre, venue, or heritage site on recommended routes',
  },
  {
    emoji: '📊',
    title: 'Mobility Analytics',
    desc: 'Anonymised route demand and cyclist behaviour data for institutional buyers',
  },
  {
    emoji: '🏛️',
    title: 'Government Partnerships',
    desc: 'Built for LTA, NParks, STB, and HPB — agencies whose mandate aligns with active mobility',
  },
]

export default function BusinessLandingPage() {
  const [stats, setStats] = useState<BusinessLandingStats | null>(null)

  useEffect(() => {
    getBusinessLandingStats()
      .then(setStats)
      .catch((error) => {
        console.error('Failed to load business landing stats', error)
      })
  }, [])

  const statItems = stats
    ? [
        { value: `${stats.monthlyUsers.toLocaleString()}+`, label: 'Monthly Users' },
        { value: stats.monthlyRouteRequests.toLocaleString(), label: 'Route Requests/mo' },
        { value: stats.activePartners.toLocaleString(), label: 'Active Partners' },
      ]
    : [
        { value: '—', label: 'Monthly Users' },
        { value: '—', label: 'Route Requests/mo' },
        { value: '—', label: 'Active Partners' },
      ]

  return (
    <div className="min-h-screen flex flex-col">
      <BusinessNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
            Reach Singapore's growing<br />cycling community.
          </h1>
          <p className="text-primary-200 text-lg mb-8">
            Sponsor routes. Buy mobility data. Partner with CycleLink.
          </p>
          <Link
            to="/login"
            className="inline-block bg-primary-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-700 transition-colors text-lg"
          >
            Become a Partner →
          </Link>
        </div>
      </section>

      {/* What we offer */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-8 text-center">
            What we offer
          </h2>
          <div className="flex flex-col gap-4">
            {offerings.map((o) => (
              <div key={o.title} className="flex gap-4 items-start bg-primary-50 rounded-2xl p-5">
                <span className="text-3xl flex-shrink-0">{o.emoji}</span>
                <div>
                  <h3 className="font-bold text-primary-900 mb-1">{o.title}</h3>
                  <p className="text-slate-600 text-sm">{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <section className="bg-primary-50 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-extrabold text-primary-900 mb-6 text-center">
            Platform at a glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {statItems.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-black text-primary-600">{s.value}</p>
                <p className="text-slate-600 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-900 px-6 py-12 text-center">
        <p className="text-white text-xl font-bold mb-4">
          Ready to reach Singapore's cyclists?
        </p>
        <Link
          to="/login"
          className="inline-block bg-white text-primary-900 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors"
        >
          Access Partner Portal →
        </Link>
      </section>

      <Footer />
    </div>
  )
}
