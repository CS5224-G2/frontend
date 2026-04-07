import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const features = [
  {
    emoji: '🌿',
    title: 'Shade-Aware Routing',
    desc: 'Every route is scored on tree canopy coverage. We keep you out of the sun so the ride actually feels good.',
  },
  {
    emoji: '⛅',
    title: 'Live Weather Intelligence',
    desc: 'Real-time NEA data factors in haze, rain probability, and heat index before you leave home.',
  },
  {
    emoji: '⛰️',
    title: 'Difficulty Matching',
    desc: 'Elevation, terrain type, and path quality scored to your fitness level — not a one-size-fits-all recommendation.',
  },
  {
    emoji: '🏮',
    title: 'Heritage & Hawker Trails',
    desc: 'Local hawker centres, parks, and historic landmarks woven into your route as optional waypoints.',
  },
  {
    emoji: '🎚️',
    title: 'Your Route, Your Weights',
    desc: 'Dial up shade, dial down difficulty. You control how each factor is scored — no two cyclists get the same result.',
  },
  {
    emoji: '🤝',
    title: 'Community-Powered',
    desc: 'Singaporean riders rate comfort, scenery, and crowding — building a local dataset no global app can replicate.',
  },
]

const steps = [
  {
    n: '1',
    title: 'Set your weights',
    desc: 'Tell us what matters most — shade, heritage, difficulty, or weather.',
  },
  {
    n: '2',
    title: 'Get your best route',
    desc: 'CycleLink scores candidate paths across all dimensions and picks your optimal ride.',
  },
  {
    n: '3',
    title: 'Ride & rate it',
    desc: 'Your feedback improves the model for every cyclist who comes after you.',
  },
]

const problems = [
  { stat: '1,300 km', label: 'of cycling paths by 2030', sub: 'and no smart navigation to match' },
  { stat: '42%', label: 'of MRT stations', sub: 'have poor cycling connectivity' },
  { stat: '0', label: 'apps account for', sub: 'shade, haze, or Singapore heritage' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-6 py-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-12">
          <div className="flex-1 text-center sm:text-left">
            <span className="inline-block bg-primary-600 text-primary-100 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
              Built for Singapore 🇸🇬
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
              The cycling app<br />Singapore deserves.
            </h1>
            <p className="text-primary-200 text-lg leading-relaxed mb-8 max-w-lg">
              Personalised route recommendations scored by shade coverage, live weather, terrain difficulty, and local heritage — tailored to <em>you</em>.
            </p>
            <div id="download" className="flex gap-3 flex-wrap justify-center sm:justify-start">
              <a
                href="#"
                className="bg-white text-primary-900 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2 shadow-md"
              >
                🍎 App Store
              </a>
              <a
                href="#"
                className="bg-white text-primary-900 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2 shadow-md"
              >
                ▶ Google Play
              </a>
            </div>
          </div>
          <div className="w-44 h-64 bg-primary-600 bg-opacity-40 border-2 border-primary-400 border-opacity-30 rounded-3xl flex items-center justify-center text-7xl flex-shrink-0 shadow-2xl">
            🚴
          </div>
        </div>
      </section>

      {/* Problem framing */}
      <section className="bg-primary-950 px-6 py-14" style={{ backgroundColor: '#0a2e18' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-400 text-xs font-bold uppercase tracking-widest text-center mb-8">
            The problem we're solving
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {problems.map((p) => (
              <div key={p.stat} className="px-4">
                <p className="text-4xl font-black text-primary-400 mb-1">{p.stat}</p>
                <p className="text-white font-semibold text-sm">{p.label}</p>
                <p className="text-primary-400 text-xs mt-1">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-600 text-xs font-bold uppercase tracking-widest text-center mb-3">
            What makes CycleLink different
          </p>
          <h2 className="text-3xl font-extrabold text-primary-900 mb-12 text-center">
            Every dimension of a great ride, scored.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-primary-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-primary-900 text-base mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary-50 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-primary-600 text-xs font-bold uppercase tracking-widest text-center mb-3">
            Simple by design
          </p>
          <h2 className="text-3xl font-extrabold text-primary-900 mb-12 text-center">
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-start justify-center gap-6">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center sm:flex-1">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-primary-900 mb-1">{s.title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <span className="text-primary-300 text-2xl hidden sm:block absolute" style={{ display: 'none' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-16 text-center">
        <h2 className="text-3xl font-black text-white mb-3">
          Ready to ride smarter?
        </h2>
        <p className="text-primary-200 mb-8 text-lg max-w-md mx-auto">
          Download CycleLink and get your first personalised route in under a minute.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <a
            href="#"
            className="bg-white text-primary-900 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2 shadow-md"
          >
            🍎 App Store
          </a>
          <a
            href="#"
            className="bg-white text-primary-900 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2 shadow-md"
          >
            ▶ Google Play
          </a>
        </div>
        <p className="text-primary-400 text-sm mt-6">
          Are you a business or public agency?{' '}
          <Link to="/business" className="text-primary-200 underline hover:text-white">
            Explore partnership opportunities →
          </Link>
        </p>
      </section>

      <Footer />
    </div>
  )
}
