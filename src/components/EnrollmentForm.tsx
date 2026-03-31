import { useState } from 'react'
import drivers from '../data/drivers.json'

const FORM_ACTION = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeIKathI3As_-4Wyn7yrT2I8W5Zq2HtMQ1JkelSr3R-HOSXGw/formResponse'
const FIELD_DRIVER = 'entry.1615508197'
const RECAPTCHA_SITE_KEY = '6LeXNKAsAAAAAKporyUCnOY-vRZErV9kOqagmJes'

declare const grecaptcha: { execute: (key: string, options: { action: string }) => Promise<string> } | undefined

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function EnrollmentForm({ onSubmitted, registeredDrivers = [] }: { onSubmitted?: () => void; registeredDrivers?: string[] }) {
  const registeredSet = new Set(registeredDrivers.map((n) => n.toUpperCase()))
  const availableDrivers = (drivers as string[]).filter((name) => !registeredSet.has(name.toUpperCase()))
  const [selected, setSelected] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    setStatus('submitting')

    const now = Date.now().toString()
    const token = typeof grecaptcha !== 'undefined'
      ? await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'enroll' })
      : null

    const body = new URLSearchParams({
      [FIELD_DRIVER]: selected,
      submissionTimestamp: now,
      ...(token ? { 'g-recaptcha-response': token } : {}),
    })

    try {
      await fetch(FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        body,
      })
      setStatus('success')
      onSubmitted?.()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-700 bg-green-950 px-6 py-8 text-center">
        <p className="text-green-400 font-semibold text-lg mb-1">Enrolled!</p>
        <p className="text-green-600 text-sm">Your registration has been sent.</p>
        <button
          onClick={() => { setSelected(''); setStatus('idle') }}
          className="mt-4 text-xs px-3 py-1.5 rounded border border-green-800 text-green-500 hover:text-green-300 hover:border-green-600 transition-colors"
        >
          Enroll another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="driver-select" className="block text-sm text-gray-400 mb-1">
          Zawodnik <span className="text-red-500">*</span>
        </label>
        <select
          id="driver-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          required
          className="w-full rounded border border-gray-700 bg-gray-800 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-red-600"
        >
          <option value="">— select —</option>
          {availableDrivers.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-xs">Submission failed. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={!selected || status === 'submitting'}
        className="w-full rounded bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold py-2 transition-colors"
      >
        {status === 'submitting' ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}
