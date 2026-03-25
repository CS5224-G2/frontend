import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const features = [
  { emoji: '🌿', title: 'Shade-Aware', desc: 'Routes rated by tree coverage so you stay cool' },
  { emoji: '⛅', title: 'Weather-Smart', desc: 'Live NEA data — avoid haze and afternoon rain' },
  { emoji: '🏮', title: 'Heritage Trails', desc: 'Hawker centres and historic sites as waypoints' },
]

const steps = [
  { n: '1', label: 'Set your preferences' },
  { n: '2', label: 'Get your best route' },
  { n: '3', label: 'Ride & rate it' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 px-6 py-16">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-black text-primary-900 leading-tight mb-4">
              Smarter cycling<br />across Singapore.
            </h1>
            <p className="text-primary-800 text-lg mb-8">
              Personalised routes scored by shade, weather, difficulty &amp; heritage.
            </p>
            <div id="download" className="flex gap-3 flex-wrap">
              <a
                href="#"
                className="bg-primary-900 text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-800 transition-colors flex items-center gap-2"
              >
                🍎 App Store
              </a>
              <a
                href="#"
                className="bg-primary-900 text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-800 transition-colors flex items-center gap-2"
              >
                ▶ Google Play
              </a>
            </div>
          </div>
          <div className="w-40 h-56 bg-primary-200 rounded-2xl flex items-center justify-center text-6xl flex-shrink-0">
            📱
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-8 text-center">
            Why CycleLink?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-primary-50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-primary-900 mb-1">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-primary-900 mb-8 text-center">
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-lg mx-auto mb-2">
                    {s.n}
                  </div>
                  <p className="text-sm font-medium text-primary-900">{s.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <span className="text-primary-300 text-2xl hidden sm:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
