import { useState, useEffect, useRef } from 'react'
import drivers from '../data/drivers.json'

const FORM_ACTION = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeIKathI3As_-4Wyn7yrT2I8W5Zq2HtMQ1JkelSr3R-HOSXGw/formResponse'
const FIELD_DRIVER = 'entry.1615508197'
const RECAPTCHA_SITE_KEY = '6LeiTKAsAAAAADBLlBP-tqhM_W7RCl2dNbreC3cQ'
const IS_LOCALHOST = location.hostname === 'localhost' || location.hostname === '127.0.0.1'

declare const grecaptcha: {
  render: (container: HTMLElement, params: { sitekey: string; callback: () => void; 'expired-callback': () => void }) => number
  getResponse: (widgetId: number) => string
  reset: (widgetId: number) => void
} | undefined

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function EnrollmentForm({ onSubmitted, registeredDrivers = [] }: { onSubmitted?: () => void; registeredDrivers?: string[] }) {
  const registeredSet = new Set(registeredDrivers.map((n) => n.toUpperCase()))
  const availableDrivers = (drivers as string[]).filter((name) => !registeredSet.has(name.toUpperCase()))
  const [selected, setSelected] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [captchaVerified, setCaptchaVerified] = useState(IS_LOCALHOST)
  const captchaRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)

  useEffect(() => {
    if (IS_LOCALHOST || typeof grecaptcha === 'undefined' || !captchaRef.current) return
    widgetId.current = grecaptcha.render(captchaRef.current, {
      sitekey: RECAPTCHA_SITE_KEY,
      callback: () => setCaptchaVerified(true),
      'expired-callback': () => setCaptchaVerified(false),
    })
  }, [])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) return
    setStatus('submitting')

    if (!IS_LOCALHOST) {
      const token = widgetId.current !== null ? grecaptcha!.getResponse(widgetId.current) : ''
      if (!token) {
        setStatus('idle')
        return
      }
    }

    const now = Date.now().toString()
    const body = new URLSearchParams({
      [FIELD_DRIVER]: selected,
      submissionTimestamp: now,
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
      if (!IS_LOCALHOST && widgetId.current !== null) grecaptcha!.reset(widgetId.current)
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
      {!IS_LOCALHOST && <div ref={captchaRef} />}
      <div>
        <label htmlFor="driver-select" className="block text-sm text-gray-400 mb-1">
          Zawodnik <span className="text-red-500">*</span>
        </label>
        <select
          id="driver-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          required
          disabled={!captchaVerified}
          className="w-full rounded border border-gray-700 bg-gray-800 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
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
        disabled={!captchaVerified || !selected || status === 'submitting'}
        className="w-full rounded bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold py-2 transition-colors"
      >
        {status === 'submitting' ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}
