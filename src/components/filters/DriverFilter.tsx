interface Props {
  query: string
  onChange: (q: string) => void
  placeholder?: string
}

export function DriverFilter({ query, onChange, placeholder = 'Filter by name…' }: Props) {
  return (
    <div className="mb-4">
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-sm rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none"
      />
    </div>
  )
}
