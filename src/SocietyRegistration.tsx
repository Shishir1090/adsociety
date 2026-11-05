
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2 } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export default function SocietyRegistration() {
  const [form, setForm] = useState({
    society_name: '',
    city: '',
    state: '',
    pincode: '',
    total_flats: '',
    occupied_flats: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  function updateField(field: string, value: string) {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setSuccess(false)

    if (!isSupabaseConfigured || !supabase) {
      setMessage('Database connection is not configured. Please check your .env file.')
      return
    }

    const total = Number(form.total_flats)
    const occupied = Number(form.occupied_flats)

    if (!Number.isInteger(total) || total <= 0) {
      setMessage('Please enter a valid total number of flats.')
      return
    }

    if (!Number.isInteger(occupied) || occupied < 0 || occupied > total) {
      setMessage('Occupied flats must be between zero and total flats.')
      return
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setMessage('Please enter a valid 6-digit PIN code.')
      return
    }

    if (form.password.length < 8) {
      setMessage('Your password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.contact_email.trim(),
        password: form.password,
        options: {
          data: {
            role: 'society',
            society_name: form.society_name.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode,
            total_flats: total,
            occupied_flats: occupied,
            contact_person: form.contact_person.trim(),
            contact_email: form.contact_email.trim(),
            contact_phone: form.contact_phone.trim(),
          },
        },
      })

      if (error) {
        setMessage('Registration failed: ' + error.message)
        return
      }

      if (!data.user) {
        setMessage('Account creation could not be verified. Please try again.')
        return
      }

      setSuccess(true)
      setMessage(
        data.session
          ? 'Account created successfully! Your society is awaiting administrator approval.'
          : 'Registration submitted! Please check your email for a confirmation link. Your society will remain pending until an administrator approves it.'
      )

      setForm({
        society_name: '',
        city: '',
        state: '',
        pincode: '',
        total_flats: '',
        occupied_flats: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        password: '',
      })
    } catch (error) {
      setMessage(
        error instanceof Error
          ? 'Registration failed: ' + error.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-top">
        <Link className="brand" to="/">
          <span className="brand-icon"><Building2 size={21} /></span>
          <span>Ad<span>Society</span></span>
        </Link>

        <Link to="/" className="back-link">
          <ArrowRight size={15} /> Back to home
        </Link>
      </div>

      <div
        className="container"
        style={{ maxWidth: 760, paddingTop: 40, paddingBottom: 64 }}
      >
        <span className="eyebrow">JOIN THE ADSOCIETY MARKETPLACE</span>
        <h1>Register your society</h1>
        <p>Create your society account and submit your community for verification.</p>

        <form
          className="login-panel"
          onSubmit={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <h2>Society details</h2>

          <div className="login-form">
            <label>
              Society name *
              <input
                required
                value={form.society_name}
                onChange={e => updateField('society_name', e.target.value)}
                placeholder="e.g. Green Valley Residency"
              />
            </label>

            <label>
              City *
              <input
                required
                value={form.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder="e.g. Noida"
              />
            </label>

            <label>
              State *
              <input
                required
                value={form.state}
                onChange={e => updateField('state', e.target.value)}
                placeholder="e.g. Uttar Pradesh"
              />
            </label>

            <label>
              PIN code *
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={e =>
                  updateField(
                    'pincode',
                    e.target.value.replace(/\D/g, '').slice(0, 6)
                  )
                }
                placeholder="6-digit PIN code"
              />
            </label>

            <label>
              Total flats *
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.total_flats}
                onChange={e => updateField('total_flats', e.target.value)}
                placeholder="e.g. 500"
              />
            </label>

            <label>
              Occupied flats *
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.occupied_flats}
                onChange={e => updateField('occupied_flats', e.target.value)}
                placeholder="e.g. 420"
              />
            </label>

            <label>
              Contact person *
              <input
                required
                value={form.contact_person}
                onChange={e => updateField('contact_person', e.target.value)}
                placeholder="Full name"
              />
            </label>

            <label>
              Contact email / Login email *
              <input
                required
                type="email"
                autoComplete="email"
                value={form.contact_email}
                onChange={e => updateField('contact_email', e.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <label>
              Contact phone *
              <input
                required
                type="tel"
                value={form.contact_phone}
                onChange={e => updateField('contact_phone', e.target.value)}
                placeholder="Mobile number"
              />
            </label>

            <label>
              Create password *
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            {message && (
              <div
                className="form-notice"
                role="alert"
                style={{ color: success ? 'green' : undefined }}
              >
                {message}
              </div>
            )}

            <button
              className="button form-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create society account'}
              <ArrowRight size={17} />
            </button>
          </div>

          <p style={{ marginTop: 16, fontSize: 13 }}>
            Your society will remain pending until an AdSociety administrator
            approves it. Email confirmation may also be required before login.
          </p>

          <p style={{ marginTop: 16, fontSize: 13 }}>
            Already registered? <Link to="/login">Log in here</Link>.
          </p>
        </form>
      </div>
    </main>
  )
}
