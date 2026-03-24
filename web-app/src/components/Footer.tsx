import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-primary-200 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="font-extrabold text-white text-lg">🚲 CycleLink</span>
        <div className="flex gap-6 text-sm">
          <Link to="/" className="hover:text-white transition-colors">For Cyclists</Link>
          <Link to="/business" className="hover:text-white transition-colors">For Business</Link>
          <Link to="/login" className="hover:text-white transition-colors">Partner Login</Link>
        </div>
        <p className="text-xs text-primary-400">© 2025 CycleLink. CS5224 Group 2.</p>
      </div>
    </footer>
  )
}
