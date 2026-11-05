
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, LockKeyhole } from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase'

export default function BrandRegistration() {
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    gst_number: '',
    yearly_marketing_budget: '',
    city: '',
    website: '',
    password: '',
  })

  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(field: string, value: string) {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')

    if (!isSupabaseConfigured || !supabase) {
      setNotice('Supabase is not configured.')
      return
    }

    if (form.password.length < 8) {
      setNotice('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.contact_email.trim(),
        password: form.password,
        options: {
          data: {
            role: 'brand',
            company_name: form.company_name.trim(),
            contact_person: form.contact_person.trim(),
            contact_email: form.contact_email.trim(),
            contact_phone: form.contact_phone.trim(),
            gst_number: form.gst_number.trim(),
            yearly_marketing_budget: form.yearly_marketing_budget,
            city: form.city.trim(),
            website: form.website.trim(),
          },
        },
      })

      if (error) {
        setNotice(error.message)
        return
      }

      if (!data.user) {
        setNotice('Registration could not be completed. Please try again.')
        return
      }

      setNotice(
        'Registration submitted successfully! Please verify your email. Your brand account will remain pending until administrator approval.'
      )

      setForm({
        company_name: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        gst_number: '',
        yearly_marketing_budget: '',
        city: '',
        website: '',
        password: '',
      })
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
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
          <span className="brand-icon">
            <Building2 size={21} />
          </span>
          <span>
            Ad<span>Society</span>
          </span>
        </Link>

        <Link to="/" className="back-link">
          <ArrowRight size={15} /> Back to home
        </Link>
      </div>

      <div
        className="container"
        style={{
          maxWidth: 650,
          paddingTop: 40,
          paddingBottom: 60,
        }}
      >
        <section className="login-panel">
          <div className="panel-heading">
            <span className="eyebrow">BRAND PARTNER REGISTRATION</span>
            <h2>Create your brand account</h2>
            <p>
              Register your company to discover advertising opportunities.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Company name *
              <input
                required
                value={form.company_name}
                onChange={e =>
                  updateField('company_name', e.target.value)
                }
                placeholder="Your company name"
              />
            </label>

            <label>
              Contact person *
              <input
                required
                value={form.contact_person}
                onChange={e =>
                  updateField('contact_person', e.target.value)
                }
                placeholder="Full name"
              />
            </label>

            <label>
              Business email *
              <input
                required
                type="email"
                value={form.contact_email}
                onChange={e =>
                  updateField('contact_email', e.target.value)
                }
                placeholder="name@company.com"
              />
            </label>

            <label>
              Mobile number *
              <input
                required
                type="tel"
                value={form.contact_phone}
                onChange={e =>
                  updateField('contact_phone', e.target.value)
                }
                placeholder="10-digit mobile number"
              />
            </label>

            <label>
              GST number
              <input
                value={form.gst_number}
                onChange={e =>
                  updateField('gst_number', e.target.value.toUpperCase())
                }
                placeholder="15-character GSTIN (optional)"
                maxLength={15}
              />
            </label>

            <label>
              Yearly marketing budget *
              <select
                required
                value={form.yearly_marketing_budget}
                onChange={e =>
                  updateField('yearly_marketing_budget', e.target.value)
                }
              >
                <option value="">Select annual budget</option>
                <option value="Below ₹5 lakh">Below ₹5 lakh</option>
                <option value="₹5–10 lakh">₹5–10 lakh</option>
                <option value="₹10–25 lakh">₹10–25 lakh</option>
                <option value="₹25–50 lakh">₹25–50 lakh</option>
                <option value="₹50 lakh–₹1 crore">
                  ₹50 lakh–₹1 crore
                </option>
                <option value="Above ₹1 crore">Above ₹1 crore</option>
              </select>
            </label>

            <label>
              City *
              <input
                required
                value={form.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder="Your city"
              />
            </label>

            <label>
              Company website
              <input
                type="url"
                value={form.website}
                onChange={e => updateField('website', e.target.value)}
                placeholder="https://example.com"
              />
            </label>

            <label>
              Password *
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            {notice && (
              <div className="form-notice" role="alert">
                {notice}
              </div>
            )}

            <button
              className="button form-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit registration'}
              <ArrowRight size={17} />
            </button>
          </form>

          <p className="secure-note">
            <LockKeyhole size={13} />
            Email verification and administrator approval required
          </p>
        </section>
      </div>
    </main>
  )
}
