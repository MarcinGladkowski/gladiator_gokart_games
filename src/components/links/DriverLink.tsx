import { Link } from 'react-router-dom'

// Driver names are unique ignoring case, so the lowercased name identifies the driver page
export function driverPath(name: string) {
  return `/driver/${encodeURIComponent(name.toLowerCase())}`
}

export function DriverLink({ name }: { name: string }) {
  return (
    <Link to={driverPath(name)} className="hover:underline underline-offset-2">
      {name}
    </Link>
  )
}
