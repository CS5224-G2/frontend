import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BusinessNavbar from '../components/BusinessNavbar'
import Footer from '../components/Footer'
import {
  getBusinessLandingStats,
  type BusinessLandingStats,
} from '../services/businessService'
import ltaLogo from '../assets/LTA-logo.jpg'
import nparksLogo from '../assets/nparks.png'
import stbLogo from '../assets/stb-logo.png'
import hpbLogo from '../assets/HPB.png'

const offerings = [
  {
    emoji: '📍',
    title: 'Sponsored Waypoints',
    badge: 'For Businesses',
    desc: 'Feature your hawker centre, venue, heritage site, or cycling-related business on recommended routes. Appear at the exact moment a cyclist is choosing where to stop.',
  },
  {
    emoji: '📊',
    title: 'Mobility Analytics',
    badge: 'For Institutions',
    desc: 'Anonymised, aggregated route demand and cyclist behaviour data. Understand where cyclists go, when, and why — for planning, research, or commercial insight.',
  },
  {
    emoji: '🏛️',
    title: 'Government Partnerships',
    badge: 'For Agencies',
    desc: "Built for LTA, NParks, STB, and HPB. Integrate CycleLink's scoring layer into public planning and active mobility campaigns.",
  },
]

const whyNow = [
  {
    stat: '1,300 km',
    label: 'Cycling paths by 2030',
    desc: "Singapore's network is expanding fast. The cyclists using it are growing with it.",
  },
  {
    stat: '42%',
    label: 'MRT stations with poor cycling links',
    desc: 'Fragmented infrastructure creates demand for intelligent routing — and for businesses along those routes.',
  },
  {
    stat: '#1',
    label: 'Gap in the market',
    desc: 'The closest local competitor is pivoting away from cycling. The market is underserved and the timing is right.',
  },
]

const agencies = [
  { logo: ltaLogo, name: 'LTA', full: 'Land Transport Authority', reason: 'Active mobility infrastructure data and planning' },
  { logo: nparksLogo, name: 'NParks', full: 'National Parks Board', reason: 'Park connector network and green corridor integration' },
  { logo: stbLogo, name: 'STB', full: 'Singapore Tourism Board', reason: 'Heritage trail promotion and tourist cycling routes' },
  { logo: hpbLogo, name: 'HPB', full: 'Health Promotion Board', reason: 'Active lifestyle campaigns and public health goals' },
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
        { value: `${stats.monthlyUsers.toLocaleString()}+`, label: 'Monthly Active Cyclists' },
        { value: stats.monthlyRouteRequests.toLocaleString(), label: 'Route Requests / month' },
        { value: stats.activePartners.toLocaleString(), label: 'Active Partners' },
      ]
    : [
        { value: '—', label: 'Monthly Active Cyclists' },
        { value: '—', label: 'Route Requests / month' },
        { value: '—', label: 'Active Partners' },
      ]

  return (
    <div className="min-h-screen flex flex-col">
      <BusinessNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-primary-600 text-primary-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
            Partner with CycleLink
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Singapore's urban cycling network<br />is growing. Be part of it.
          </h1>
          <p className="text-primary-200 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Sponsor routes. Buy mobility analytics. Partner on public health and active mobility policy. CycleLink connects your organisation to Singapore's most engaged cyclists.
          </p>
          <Link
            to="/login"
            className="inline-block bg-white text-primary-900 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors text-lg shadow-lg"
          >
            Become a Partner →
          </Link>
        </div>
      </section>

      {/* Why now */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-600 text-xs font-bold uppercase tracking-widest text-center mb-3">
            The market opportunity
          </p>
          <h2 className="text-3xl font-extrabold text-primary-900 mb-12 text-center">
            Why now?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {whyNow.map((w) => (
              <div key={w.stat} className="text-center px-4">
                <p className="text-5xl font-black text-primary-600 mb-2">{w.stat}</p>
                <p className="font-bold text-primary-900 text-sm mb-2">{w.label}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="bg-primary-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-600 text-xs font-bold uppercase tracking-widest text-center mb-3">
            Partnership tiers
          </p>
          <h2 className="text-3xl font-extrabold text-primary-900 mb-10 text-center">
            Built for businesses and agencies
          </h2>
          <div className="flex flex-col gap-5">
            {offerings.map((o) => (
              <div key={o.title} className="flex gap-5 items-start bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-4xl flex-shrink-0 mt-1">{o.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-primary-900 text-lg">{o.title}</h3>
                    <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      {o.badge}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <section className="bg-primary-900 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-400 text-xs font-bold uppercase tracking-widest text-center mb-3">
            Platform at a glance
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-10 text-center">
            The audience you're reaching
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {statItems.map((s) => (
              <div key={s.label}>
                <p className="text-5xl font-black text-primary-400 mb-2">{s.value}</p>
                <p className="text-primary-200 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agency callout */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-600 text-xs font-bold uppercase tracking-widest text-center mb-3">
            Public sector
          </p>
          <h2 className="text-3xl font-extrabold text-primary-900 mb-4 text-center">
            Aligned with Singapore's active mobility agenda
          </h2>
          <p className="text-slate-500 text-center text-sm mb-10 max-w-xl mx-auto">
            CycleLink's scoring layer and anonymised mobility data are designed to support the mandate of key Singapore agencies.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agencies.map((a) => (
              <div key={a.name} className="flex items-center gap-4 bg-primary-50 rounded-xl p-5">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm p-1">
                  <img src={a.logo} alt={a.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-bold text-primary-900 text-sm">{a.full}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{a.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-16 text-center">
        <h2 className="text-3xl font-black text-white mb-3">
          Ready to reach Singapore's cyclists?
        </h2>
        <p className="text-primary-200 mb-8 max-w-md mx-auto leading-relaxed">
          Enquire about sponsored waypoints, mobility data access, or a government partnership today.
        </p>
        <Link
          to="/login"
          className="inline-block bg-white text-primary-900 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-lg text-lg"
        >
          Access Partner Portal →
        </Link>
        <p className="text-primary-400 text-sm mt-6">
          Looking for the user app?{' '}
          <Link to="/" className="text-primary-200 underline hover:text-white">
            Download CycleLink →
          </Link>
        </p>
      </section>

      <Footer />
    </div>
  )
}
