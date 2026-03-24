import { Link } from 'react-router-dom'

export default function BusinessNavbar() {
  return (
    <nav className="bg-primary-900 px-6 py-3 flex items-center justify-between">
      <Link to="/business" className="flex items-center gap-2 text-white font-extrabold text-lg">
        <span aria-hidden="true">🚲</span> CycleLink{' '}
        <span className="font-normal text-primary-200 text-sm">Business</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-primary-200 hover:text-white text-sm transition-colors">
          For Cyclists
        </Link>
        <Link
          to="/login"
          className="bg-primary-600 text-white font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-primary-700 transition-colors"
        >
          Partner Login
        </Link>
      </div>
    </nav>
  )
}
