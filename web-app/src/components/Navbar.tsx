import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-primary-600 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-white font-extrabold text-lg">
        <span aria-hidden="true">🚲</span> CycleLink
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/business" className="text-primary-100 hover:text-white text-sm transition-colors">
          For Business
        </Link>
        <a
          href="#download"
          className="bg-white text-primary-700 font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-primary-50 transition-colors"
        >
          Download App
        </a>
      </div>
    </nav>
  )
}
