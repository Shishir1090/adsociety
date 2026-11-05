import BrandMyBookings from './BrandMyBookings'
import AdminDashboard from './AdminDashboard'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Building2, Check, CircleHelp,
  FileCheck2, Globe2, Layers3, LockKeyhole, Menu, Megaphone,
  ShieldCheck, Sparkles, Wallet, X, LogOut
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import SupabaseTest from './SupabaseTest'
import SocietyRegistration from './SocietyRegistration'
import BrandRegistration from './BrandRegistration'
import BrandMarketplace from './BrandMarketplace'

function BrandMark() {
  return (
    <Link className="brand" to="/" aria-label="AdSociety home">
      <span className="brand-icon">
        <Building2 size={21} strokeWidth={2.4} />
      </span>
      <span>Ad<span>Society</span></span>
    </Link>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <BrandMark />

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#inventory" onClick={() => setMenuOpen(false)}>Ad formats</a>
          <a href="#for-societies" onClick={() => setMenuOpen(false)}>For societies</a>
          <a href="#for-brands" onClick={() => setMenuOpen(false)}>For brands</a>
          <Link className="nav-login" to="/login">Log in</Link>
          <Link className="button button-small" to="/login">
            Get started <ArrowRight size={15} />
          </Link>
        </nav>
      </div>
    </header>
  )
}


function HomePage() {
    const [activeProcess, setActiveProcess] = useState<'society' | 'brand'>('society')
  return (
    <>
      <Header />

      <main>
        <section className="hero-section hero-video-section">
          <video
            className="hero-background-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source
              src="/videos/adsociety-background.mp4"
              type="video/mp4"
            />
          </video>

          <div className="hero-video-overlay" />
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />

          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <Sparkles size={14} /> THE RESIDENTIAL ADVERTISING MARKETPLACE
              </div>

              <h1>Where communities <span>meet brands.</span></h1>

              <p className="hero-description">
                Discover verified residential communities, book advertising spaces
                and run local campaigns — directly, transparently and at scale.
              </p>

              <div className="hero-actions">
                  <a className="button button-ghost" href="#how-it-works">
                  See how it works
                </a>
              </div>

              <div className="hero-proof">
                <span><ShieldCheck size={16} /> Verified listings</span>
                <span><Wallet size={16} /> Transparent pricing</span>
                <span><Globe2 size={16} /> Built for India</span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-topline">
                <span className="live-dot" /> MARKETPLACE PREVIEW
                <span className="visual-location">INDIA</span>
              </div>

              <div className="visual-image">
                <div className="image-overlay">
                  <span className="image-tag">RESIDENTIAL MEDIA</span>
                  <strong>Reach people<br />where they live.</strong>
                  <span className="image-subtitle">
                    One marketplace. Thousands of local opportunities.
                  </span>
                </div>
              </div>

              <div className="visual-stats">
                <div>
                  <span className="stat-icon"><Building2 size={17} /></span>
                  <strong>Societies</strong>
                  <small>Verified communities</small>
                </div>
                <div>
                  <span className="stat-icon purple"><Layers3 size={17} /></span>
                  <strong>Ad spaces</strong>
                  <small>Offline + digital</small>
                </div>
                <div>
                  <span className="stat-icon green"><ShieldCheck size={17} /></span>
                  <strong>Bookings</strong>
                  <small>Managed end-to-end</small>
                </div>
              </div>
            </div>
          </div>

          <div className="container hero-bottom">
            <span>MADE FOR RESIDENTIAL COMMUNITIES</span>
            <span className="hero-bottom-line" />
            <span>BUILT FOR MODERN BRANDS</span>
          </div>
        </section>

        <section className="audience-section section-pad">
          <div className="container">
            <div className="section-heading centered">
              <span className="eyebrow">ONE PLATFORM, TWO SIDES</span>
              <h2>Simple for everyone.<br /><span>Powerful together.</span></h2>
              <p>
                AdSociety brings advertising opportunities and brands together
                in one trusted marketplace.
              </p>
            </div>

            <div className="audience-grid">
              <article className="audience-card society-card" id="for-societies">
                <div className="card-icon blue"><Building2 size={23} /></div>
                <span className="card-kicker">FOR RESIDENTIAL SOCIETIES</span>
                <h3>Turn your spaces<br />into opportunities.</h3>
                <p>
                  List available advertising inventory, set your rates and
                  review brand proposals from one dashboard.
                </p>
                <ul>
                  <li><Check size={16} /> List inventory for free</li>
                  <li><Check size={16} /> Review every campaign request</li>
                  <li><Check size={16} /> Track bookings and campaigns</li>
                </ul>
                <Link to="/register-society" className="text-link">
                  Register your society <ArrowRight size={16} />
                </Link>
                <div className="card-watermark"><Building2 size={145} /></div>
              </article>

              <article className="audience-card brand-card" id="for-brands">
                <div className="card-icon violet"><Megaphone size={23} /></div>
                <span className="card-kicker">FOR BRANDS & ADVERTISERS</span>
                <h3>Find your audience<br />closer to home.</h3>
                <p>
                  Search communities by location, audience size and format.
                  Build campaigns across multiple societies.
                </p>
                <ul>
                  <li><Check size={16} /> Compare verified opportunities</li>
                  <li><Check size={16} /> Create multi-society campaigns</li>
                  <li><Check size={16} /> Book and track online</li>
                </ul>
                <Link to="/register-brand" className="text-link">
                  Create a brand account <ArrowRight size={16} />
                </Link>
                <div className="card-watermark"><Megaphone size={145} /></div>
              </article>
            </div>
          </div>
        </section>

        <section className="inventory-section section-pad" id="inventory">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">ADVERTISING FORMATS</span>
              <h2>More ways to be <span>seen locally.</span></h2>
              <p>
                From physical activations to digital placements, discover
                advertising formats within residential communities.
              </p>
            </div>

            <div className="format-grid">
              <Format icon={<Layers3 />} title="Kiosk & activations" text="Promotional booths, sampling and brand engagement." />
              <Format icon={<FileCheck2 />} title="Signage & displays" text="Lift, lobby, gate and clubhouse branding." />
              <Format icon={<Building2 />} title="Car & bike displays" text="Reach residents in high-traffic parking areas." />
              <Format icon={<Sparkles />} title="Events & carnivals" text="Kids carnivals, festivals and community events." />
              <Format icon={<Globe2 />} title="Digital screens" text="Screens, digital notice boards and displays." />
              <Format icon={<Megaphone />} title="Digital promotions" text="Community app and other approved digital formats." />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="process-section section-pad" id="how-it-works">
          <div className="container">

            <div className="section-heading centered">
              <span className="eyebrow">HOW ADSOCIETY WORKS</span>
              <h2>Two journeys.<br /><span>One trusted marketplace.</span></h2>
              <p>
                Whether you represent a residential community or a brand,
                getting started with AdSociety is simple and transparent.
              </p>
            </div>

            <div className="process-switch-buttons">
            <button
             type="button"
             className={activeProcess === 'society' ? 'button' : 'button button-outline'}
             onClick={() => setActiveProcess('society')}
             >
              <Building2 size={17} /> Society Process <ArrowRight size={16} />
              </button>

  <button
    type="button"
    className={activeProcess === 'brand' ? 'button' : 'button button-outline'}
    onClick={() => setActiveProcess('brand')}
  >
    <Megaphone size={17} /> Brand Process <ArrowRight size={16} />
  </button>
</div>

            {/* SOCIETY JOURNEY */}
            {activeProcess === 'society' && (
           <article className="journey-card society-journey" id="society-process">
              <div className="journey-header">
                <div className="journey-heading-icon">
                  <Building2 size={26} />
                </div>
                <div>
                  <span className="card-kicker">FOR RESIDENTIAL COMMUNITIES</span>
                  <h3>Society Process</h3>
                  <p>
                    Turn your community's advertising spaces into organised
                    revenue opportunities.
                  </p>
                </div>
              </div>

              <div className="journey-steps">
                <div className="journey-step">
                  <span className="journey-number">01</span>
                  <div>
                    <h4>Register your society</h4>
                    <p>
                      Submit your society name, address, city, pincode,
                      total flats, occupied units and authorised contact details.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">02</span>
                  <div>
                    <h4>Admin verification and approval</h4>
                    <p>
                      The AdSociety Admin team reviews your registration.
                      Once approved, your society account is activated.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">03</span>
                  <div>
                    <h4>Login to your society dashboard</h4>
                    <p>
                      Sign in using your registered credentials. Your
                      approved account takes you directly to your society workspace.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">04</span>
                  <div>
                    <h4>Add your advertising inventory</h4>
                    <p>
                      List kiosks, lift posters, lift screens, gate arches,
                      building banners, car displays, bike displays,
                      kids' activities and other available spaces. Add photos,
                      rates, availability and relevant details.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">05</span>
                  <div>
                    <h4>Admin reviews your listings</h4>
                    <p>
                      AdSociety verifies the inventory details, photos,
                      pricing and listing information before approving
                      items for the brand marketplace.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">06</span>
                  <div>
                    <h4>Receive and review brand proposals</h4>
                    <p>
                      Brands can request your approved advertising spaces.
                      View campaign details and decide whether to approve
                      or reject each item belonging to your society.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">07</span>
                  <div>
                    <h4>Campaign approval and booking</h4>
                    <p>
                      Each campaign item requires both Admin and Society
                      approval. Once approved, it remains in the campaign.
                      Rejected items are excluded from the final campaign.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">08</span>
                  <div>
                    <h4>Campaign execution and revenue</h4>
                    <p>
                      After the brand completes payment for approved items,
                      booking confirmations are generated. Coordinate the
                      campaign within your society and earn revenue from
                      your advertising inventory.
                    </p>
                  </div>
                </div>
              </div>

              <div className="journey-benefits">
                <h4><Check size={19} /> How AdSociety helps societies</h4>
                <ul>
                  <li>Generate additional revenue from available community spaces.</li>
                  <li>Connect directly with brands looking for residential audiences.</li>
                  <li>Set your inventory details and proposed advertising rates.</li>
                  <li>Retain control over every campaign request through approvals.</li>
                  <li>Manage inventory and booking requests from one dashboard.</li>
                  <li>Bring transparency and organisation to community advertising.</li>
                </ul>
              </div>

              <div className="journey-cta">
                <div>
                  <strong>Ready to list your society?</strong>
                  <p>Register your community and start exploring advertising opportunities.</p>
                </div>
                <Link to="/register-society" className="button">
                  Register Society <ArrowRight size={17} />
                </Link>
              </div>
            </article>
             )}
            {/* BRAND JOURNEY */}
             {activeProcess === 'brand' && (
             <article className="journey-card brand-journey" id="brand-process">
              <div className="journey-header">
                <div className="journey-heading-icon">
                  <Megaphone size={26} />
                </div>
                <div>
                  <span className="card-kicker">FOR BRANDS & ADVERTISERS</span>
                  <h3>Brand Process</h3>
                  <p>
                    Discover residential audiences and manage campaigns
                    across multiple communities through one platform.
                  </p>
                </div>
              </div>

              <div className="journey-steps">
                <div className="journey-step">
                  <span className="journey-number">01</span>
                  <div>
                    <h4>Register your brand</h4>
                    <p>
                      Create your account with your company name,
                      business details, contact person, email and phone number.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">02</span>
                  <div>
                    <h4>Admin verification and approval</h4>
                    <p>
                      AdSociety reviews your brand registration. Once
                      approved, you can access the residential marketplace.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">03</span>
                  <div>
                    <h4>Login to your brand account</h4>
                    <p>
                      Sign in through the common AdSociety login page.
                      Your approved brand account opens your marketplace workspace.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">04</span>
                  <div>
                    <h4>Discover residential communities</h4>
                    <p>
                      Explore verified communities and search by pincode,
                      location and available advertising categories.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">05</span>
                  <div>
                    <h4>Filter and compare inventory</h4>
                    <p>
                      Explore kiosks, lift branding, digital screens,
                      gate arches, banners, car and bike displays,
                      health campaigns, kids' activities and other
                      available advertising formats. Compare rates
                      and listing details.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">06</span>
                  <div>
                    <h4>Create your campaign cart</h4>
                    <p>
                      Select multiple advertising spaces, including
                      inventory from different societies, and combine
                      them into one campaign request.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">07</span>
                  <div>
                    <h4>Admin and Society approvals</h4>
                    <p>
                      AdSociety Admin reviews each campaign item and
                      each participating society approves or rejects
                      its own items. Approved items remain in the campaign;
                      rejected items are removed.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">08</span>
                  <div>
                    <h4>Review your revised campaign total</h4>
                    <p>
                      Once decisions are complete, see the final list
                      of approved advertising spaces and the revised
                      amount payable for your campaign.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">09</span>
                  <div>
                    <h4>Make one consolidated payment</h4>
                    <p>
                      Pay securely through Razorpay for all approved
                      campaign items in one transaction.
                    </p>
                  </div>
                </div>

                <div className="journey-step">
                  <span className="journey-number">10</span>
                  <div>
                    <h4>Get booking confirmations and manage campaigns</h4>
                    <p>
                      Receive booking confirmations for the participating
                      societies and track your campaign and booking details
                      from your brand account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="journey-benefits">
                <h4><Check size={19} /> How AdSociety helps brands</h4>
                <ul>
                  <li>Access multiple residential communities through one platform.</li>
                  <li>Discover advertising opportunities by pincode and category.</li>
                  <li>Compare available inventory and pricing transparently.</li>
                  <li>Build campaigns across multiple societies in one cart.</li>
                  <li>Get item-wise approval visibility before making payment.</li>
                  <li>Make one consolidated payment for approved campaign items.</li>
                  <li>Manage bookings and campaign information from one workspace.</li>
                </ul>
              </div>

              <div className="journey-cta">
                <div>
                  <strong>Ready to reach residential audiences?</strong>
                  <p>Create your brand account and discover advertising opportunities.</p>
                </div>
                <Link to="/register-brand" className="button">
                  Register Your Brand <ArrowRight size={17} />
                </Link>
              </div>
            </article>
            )}
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-inner">
            <div>
              <span className="eyebrow">START WITH ADSOCIETY</span>
              <h2>Make every community<br />a new opportunity.</h2>
              <p>
                Join a marketplace built for direct, transparent residential advertising.
              </p>
            </div>
            <Link to="/login" className="button button-light">
              Get started <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <BrandMark />
          <span>© {new Date().getFullYear()} AdSociety. All rights reserved.</span>
          <span>Where Communities Meet Brands.</span>
        </div>
      </footer>
    </>
  )
}

function Format({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <article className="format-card">
      <div className="format-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowRight className="format-arrow" size={17} />
    </article>
  )
}

/* LOGIN PAGE */

function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')

    if (!email.trim() || !password.trim()) {
      setNotice('Enter your email and password to continue.')
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setNotice('Supabase is not configured. Please check your settings.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setNotice(error.message)
        return
      }

      if (!data.user) {
        setNotice('Login could not be completed. Please try again.')
        return
      }

      const userId = data.user.id

      // 1. Check whether this account belongs to a society.
      const { data: society, error: societyError } = await supabase
        .from('societies')
        .select('id, approval_status')
        .eq('owner_id', userId)
        .maybeSingle()

      if (societyError) {
        await supabase.auth.signOut()
        setNotice(`Society account verification failed: ${societyError.message}`)
        return
      }

      // 2. Check whether this account belongs to a brand.
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('approval_status')
        .eq('id', userId)
        .maybeSingle()

      if (brandError) {
        await supabase.auth.signOut()
        setNotice(`Brand account verification failed: ${brandError.message}`)
        return
      }

      // A user should not have two different account types.
      if (society && brand) {
        await supabase.auth.signOut()
        setNotice('Your account has multiple profiles. Please contact AdSociety support.')
        return
      }

      // 3. Society account.
      if (society) {
        if (society.approval_status === 'pending') {
          await supabase.auth.signOut()
          setNotice('Your society account is awaiting administrator approval.')
          return
        }

        if (society.approval_status === 'rejected') {
          await supabase.auth.signOut()
          setNotice('Your society registration has not been approved. Please contact support.')
          return
        }

        if (society.approval_status !== 'approved') {
          await supabase.auth.signOut()
          setNotice('Your society account status could not be verified.')
          return
        }

        navigate('/society-dashboard')
        return
      }

      // 4. Brand account.
      if (brand) {
        if (brand.approval_status === 'pending') {
          await supabase.auth.signOut()
          setNotice('Your brand account is awaiting administrator approval.')
          return
        }

        if (brand.approval_status === 'rejected') {
          await supabase.auth.signOut()
          setNotice('Your brand registration has not been approved. Please contact support.')
          return
        }

        if (brand.approval_status !== 'approved') {
          await supabase.auth.signOut()
          setNotice('Your brand account status could not be verified.')
          return
        }

        navigate('/brand-marketplace')
        return
      }

      // 5. Only check admin access if no society or brand profile exists.
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (adminError) {
        await supabase.auth.signOut()
        setNotice(`Administrator verification failed: ${adminError.message}`)
        return
      }

      if (admin?.role === 'admin') {
        navigate('/admin')
        return
      }

      await supabase.auth.signOut()
      setNotice('No approved AdSociety account was found for this email. Please register or contact support.')

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
    <main className="login-page login-video-page">
      <video
        className="login-background-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source
          src="/videos/adsociety-background.mp4"
          type="video/mp4"
        />
      </video>

      <div className="login-video-overlay" />

      <div className="login-top">
        <BrandMark />
        <Link to="/" className="back-link">
          <ArrowRight size={15} /> Back to home
        </Link>
      </div>

      <div className="login-layout">
        <div className="login-intro">
          <span className="eyebrow">WELCOME TO ADSOCIETY</span>

          <h1>
            Where communities
            <br />
            <span>meet brands.</span>
          </h1>

          <p>
            One trusted marketplace connecting residential communities
            with brands. Discover opportunities, manage campaigns and
            grow together.
          </p>

          <div className="login-benefits">
            <span><ShieldCheck /> Verified marketplace</span>
            <span><LockKeyhole /> Secure account access</span>
            <span><Wallet /> Transparent transactions</span>
            <span><Building2 /> Built for communities</span>
          </div>
        </div>

        <section className="login-panel login-video-panel">
          <div className="panel-heading">
            <span className="eyebrow">ACCOUNT ACCESS</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your AdSociety workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleContinue}>
            <label>
              Email address
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              {loading ? 'Verifying your account...' : 'Sign in'}
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="login-register">
            New to AdSociety?
            <div className="login-registration-links">
              <Link to="/register-society">Register your society</Link>
              <span>·</span>
              <Link to="/register-brand">Create a brand account</Link>
            </div>
          </div>

          <div className="secure-note">
            <LockKeyhole size={13} />
            Secure login · Protected account access
          </div>
        </section>
      </div>

      <div className="login-help">
        <CircleHelp size={15} />
        Need help? Contact AdSociety support.
      </div>
    </main>
  )
}


/* SOCIETY DASHBOARD */


function SocietyDashboard() {
  const navigate = useNavigate()

  const [society, setSociety] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [sponsorshipRequests, setSponsorshipRequests] = useState<any[]>([])
  const [bookingRequests, setBookingRequests] = useState<any[]>([])

  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('Community Event')
  const [eventDate, setEventDate] = useState('')
  const [expectedAudience, setExpectedAudience] = useState('')

  const [sponsorshipAmount, setSponsorshipAmount] = useState('')
  const [sponsorshipPurpose, setSponsorshipPurpose] = useState('')
  const [sponsorBenefits, setSponsorBenefits] = useState('')
  const [proposalUrl, setProposalUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showInventoryForm, setShowInventoryForm] = useState(false)

  const [inventoryName, setInventoryName] = useState('')
  const [category, setCategory] = useState('Signage')
  const [quantity, setQuantity] = useState('1')
  const [rate, setRate] = useState('')
  const [rateUnit, setRateUnit] = useState('per month')
  const [locationDetails, setLocationDetails] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      if (!supabase) {
        if (isMounted) {
          setError('Supabase is not configured.')
          setLoading(false)
        }
        return
      }

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser()

        if (userError || !userData.user) {
          if (isMounted) {
            setError('Your session has expired. Please log in again.')
            setLoading(false)
          }
          return
        }

        const { data: societyData, error: societyError } =
          await supabase
            .from('societies')
            .select('*')
            .eq('owner_id', userData.user.id)
            .maybeSingle()

        if (societyError || !societyData) {
          if (isMounted) {
            setError(
              societyError?.message ||
              'Your society profile could not be found.'
            )
            setLoading(false)
          }
          return
        }

        if (societyData.approval_status !== 'approved') {
          if (isMounted) {
            setError('Your society is not approved for dashboard access.')
            setLoading(false)
          }
          return
        }

        const { data: inventoryData, error: inventoryError } =
          await supabase
            .from('society_inventory')
            .select('*')
            .eq('society_id', societyData.id)
            .order('created_at', { ascending: false })

        const { data: sponsorshipData, error: sponsorshipError } =
          await supabase
            .from('sponsorship_requests')
            .select('*')
            .eq('society_id', societyData.id)
            .order('created_at', { ascending: false })

        const { data: bookingData, error: bookingError } =
          await supabase
            .from('booking_requests')
            .select('*')
            .eq('society_id', societyData.id)
            .order('created_at', { ascending: false })

        if (!isMounted) return

        if (inventoryError) {
          setError(inventoryError.message)
        } else if (sponsorshipError) {
          setError(sponsorshipError.message)
        } else if (bookingError) {
          setError(bookingError.message)
        } else {
          setSociety(societyData)
          setInventory(inventoryData ?? [])
          setSponsorshipRequests(sponsorshipData ?? [])
          setBookingRequests(bookingData ?? [])
        }

        setLoading(false)
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load your dashboard.'
          )
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleAddInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!supabase || !society) {
      setError('Your society account could not be verified.')
      return
    }

    const parsedQuantity = Number(quantity)
    const parsedRate = Number(rate)

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError('Please enter a valid quantity.')
      return
    }

    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      setError('Please enter a valid advertising rate.')
      return
    }

    setSaving(true)

    try {
      const { data, error: insertError } = await supabase
        .from('society_inventory')
        .insert({
          society_id: society.id,
          item_name: inventoryName.trim(),
          category,
          quantity: parsedQuantity,
          rate: parsedRate,
          rate_unit: rateUnit,
          location_details: locationDetails.trim() || null,
          description: description.trim() || null,
          approval_status: 'pending',
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      setInventory(previous => [data, ...previous])

      setInventoryName('')
      setCategory('Signage')
      setQuantity('1')
      setRate('')
      setRateUnit('per month')
      setLocationDetails('')
      setDescription('')

      setNotice('Inventory submitted successfully for Admin approval.')
      setShowInventoryForm(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit inventory.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSponsorship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!supabase || !society) {
      setError('Your society account could not be verified.')
      return
    }

    const amount = Number(sponsorshipAmount)
    const audience = Number(expectedAudience)

    if (!Number.isFinite(amount) || amount < 0) {
      setError('Please enter a valid sponsorship amount.')
      return
    }

    if (!Number.isInteger(audience) || audience < 0) {
      setError('Please enter a valid expected audience.')
      return
    }

    setSaving(true)

    try {
      const { data, error: insertError } = await supabase
        .from('sponsorship_requests')
        .insert({
          society_id: society.id,
          event_name: eventName.trim(),
          event_type: eventType,
          event_date: eventDate || null,
          expected_audience: audience,
          sponsorship_amount: amount,
          purpose: sponsorshipPurpose.trim() || null,
          sponsor_benefits: sponsorBenefits.trim() || null,
          proposal_url: proposalUrl.trim() || null,
          approval_status: 'pending',
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSponsorshipRequests(previous => [data, ...previous])

      setEventName('')
      setEventType('Community Event')
      setEventDate('')
      setExpectedAudience('')
      setSponsorshipAmount('')
      setSponsorshipPurpose('')
      setSponsorBenefits('')
      setProposalUrl('')

      setNotice('Sponsorship request submitted for Admin approval.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit sponsorship request.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleBookingDecision(
    bookingId: string,
    decision: 'approved' | 'rejected'
  ) {
    setError('')
    setNotice('')

    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setSaving(true)

    try {
      const { data, error: updateError } = await supabase
        .from('booking_requests')
        .update({
          society_status: decision,
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        return
      }

      setBookingRequests(previous =>
        previous.map(request =>
          request.id === bookingId ? data : request
        )
      )

      setNotice(
        decision === 'approved'
          ? 'Booking approved by society. Waiting for Admin approval if pending.'
          : 'Booking rejected by society.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update booking.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    navigate('/login')
  }

  return (
    <main className="login-page">
      <div className="login-top">
        <BrandMark />
        <button className="button button-small" onClick={handleLogout}>
          <LogOut size={15} /> Log out
        </button>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <span className="eyebrow">SOCIETY PORTAL</span>
        <h1>Society Dashboard</h1>

        {loading && <p>Loading your society account...</p>}

        {error && (
          <div className="form-notice" role="alert" style={{ marginTop: 20 }}>
            {error}
          </div>
        )}

        {!loading && society && (
          <>
            {/* SOCIETY PROFILE */}
            <section className="society-profile-card">
              <div className="society-profile-top">
                <span className="eyebrow">SOCIETY PROFILE</span>
                <span className="society-approved-badge">
                  ✓ Verified & Approved
                </span>
              </div>

              <div className="society-profile-heading">
                <div className="society-profile-icon">
                  <Building2 size={30} />
                </div>

                <div className="society-profile-name">
                  <h2>{society.society_name}</h2>
                  <p>
                    <Globe2 size={15} />
                    {[society.city, society.state, society.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>

              <div className="society-profile-stats">
                <div className="society-stat-box">
                  <span>TOTAL FLATS</span>
                  <strong>{society.total_flats ?? '—'}</strong>
                  <small>Registered units</small>
                </div>

                <div className="society-stat-box">
                  <span>OCCUPIED FLATS</span>
                  <strong>{society.occupied_flats ?? '—'}</strong>
                  <small>Occupied units</small>
                </div>
              </div>

              <div className="society-occupancy">
                <div className="society-occupancy-label">
                  <span>Occupancy rate</span>
                  <strong>
                    {society.total_flats
                      ? `${Math.round(
                          ((society.occupied_flats ?? 0) /
                            society.total_flats) * 100
                        )}%`
                      : '—'}
                  </strong>
                </div>

                <div className="society-occupancy-track">
                  <div
                    className="society-occupancy-fill"
                    style={{
                      width: `${society.total_flats
                        ? Math.min(
                            100,
                            ((society.occupied_flats ?? 0) /
                              society.total_flats) * 100
                          )
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              <div className="society-profile-footer">
                <span>Account status</span>
                <strong>✓ Active · Approved</strong>
              </div>
            </section>

            {/* ADVERTISING INVENTORY */}
            <section className="inventory-manager-card">
              <div className="inventory-manager-heading">
                <div className="inventory-manager-icon">
                  <Layers3 size={28} />
                </div>

                <div className="inventory-manager-copy">
                  <span className="eyebrow">ADVERTISING INVENTORY</span>
                  <h2>Manage your advertising spaces</h2>
                  <p>
                    Add kiosks, signage, displays and other advertising
                    opportunities available in your society.
                    All new listings require Admin approval.
                  </p>
                </div>

                <button
                  type="button"
                  className="button inventory-add-button"
                  onClick={() =>
                    setShowInventoryForm(previous => !previous)
                  }
                >
                  {showInventoryForm ? 'Close form' : '+ Add New Inventory'}
                </button>
              </div>

              {notice && (
                <div className="inventory-notice" role="status">
                  {notice}
                </div>
              )}

              {showInventoryForm && (
                <div className="inventory-form-panel">
                  <div className="inventory-form-title">
                    <h3>Register advertising inventory</h3>
                    <p>
                      Enter the details below to submit a new advertising
                      space for approval.
                    </p>
                  </div>

                  <form
                    className="login-form inventory-form-grid"
                    onSubmit={handleAddInventory}
                  >
                    <label>
                      Inventory name *
                      <input
                        required
                        maxLength={120}
                        placeholder="Example: Lift Branding"
                        value={inventoryName}
                        onChange={e => setInventoryName(e.target.value)}
                      />
                    </label>

                    <label>
                      Advertising category *
                      <select
                        required
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                      >
                        <option value="Signage">Signage and banners</option>
                        <option value="Kiosk">Kiosk and activations</option>
                        <option value="Car Display">Car display</option>
                        <option value="Bike Display">Bike display</option>
                        <option value="Lift Branding">Lift branding</option>
                        <option value="Digital Screens">Digital screens</option>
                        <option value="Kids Carnival">Kids carnival</option>
                        <option value="Events">Events and sponsorship</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    <label>
                      Available quantity *
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                      />
                    </label>

                    <label>
                      Advertising rate (₹) *
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="Example: 5000"
                        value={rate}
                        onChange={e => setRate(e.target.value)}
                      />
                    </label>

                    <label>
                      Rate basis *
                      <select
                        value={rateUnit}
                        onChange={e => setRateUnit(e.target.value)}
                      >
                        <option value="per month">Per month</option>
                        <option value="per day">Per day</option>
                        <option value="per event">Per event</option>
                        <option value="per booking">Per booking</option>
                        <option value="one time">One time</option>
                      </select>
                    </label>

                    <label>
                      Location inside society
                      <input
                        placeholder="Example: Tower A, Lift Lobby"
                        value={locationDetails}
                        onChange={e => setLocationDetails(e.target.value)}
                      />
                    </label>

                    <label className="inventory-description-field">
                      Description
                      <textarea
                        rows={4}
                        placeholder="Describe the advertising space, dimensions or facilities..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </label>

                    <div className="inventory-form-actions">
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setShowInventoryForm(false)}
                      >
                        Cancel
                      </button>

                      <button
                        className="button form-submit"
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? 'Submitting...' : 'Submit for Admin Approval'}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </section>

           
{/* YOUR INVENTORY LISTINGS */}
<section className="society-listings-section">
  <details className="society-listings-details">
    <summary className="society-listings-summary">
      <div className="society-listings-heading">
        <div className="society-listings-icon">
          <Layers3 size={25} />
        </div>

        <div>
          <span className="eyebrow">YOUR LISTINGS</span>
          <h2>Inventory Submitted</h2>
          <p>
            View and manage the advertising inventory submitted by your society.
          </p>
        </div>
      </div>

      <span className="society-explore-button">
        Explore Inventory
        <span className="society-listings-arrow">⌄</span>
      </span>
    </summary>

    <div className="society-listings-content">
      {inventory.length === 0 ? (
        <div className="login-panel">
          <p>You have not added any inventory yet.</p>
        </div>
      ) : (
        <div className="format-grid">
          {inventory.map(item => (
            <article className="format-card" key={item.id}>
              <div className="format-icon">
                <Layers3 />
              </div>

              <h3>{item.item_name}</h3>
              <p>{item.category}</p>
              <p>Quantity: {item.quantity}</p>

              <p>
                Rate: ₹{Number(item.rate).toLocaleString('en-IN')}
                {' '}{item.rate_unit}
              </p>

              {item.location_details && (
                <p>Location: {item.location_details}</p>
              )}

              <p>
                Status:{' '}
                <strong>
                  {item.approval_status === 'approved'
                    ? 'Approved'
                    : item.approval_status === 'rejected'
                      ? 'Rejected'
                      : 'Pending Admin Approval'}
                </strong>
              </p>

              {item.admin_remarks && (
                <p>Admin remarks: {item.admin_remarks}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  </details>
</section>

            {/* COMMUNITY SPONSORSHIPS */}
            <section className="login-panel" style={{ marginTop: 32 }}>
              <span className="eyebrow">COMMUNITY SPONSORSHIPS</span>
              <h2><Megaphone size={22} /> Sponsorship Requests</h2>
              <p>
                Submit sponsorship opportunities for your society events.
                Admin will review your request before it becomes visible to brands.
              </p>

              <form
                className="login-form"
                onSubmit={handleAddSponsorship}
                style={{ marginTop: 20 }}
              >
                <label>
                  Event name *
                  <input
                    required
                    maxLength={150}
                    placeholder="Example: Annual Society Carnival"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                  />
                </label>

                <label>
                  Event type *
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                  >
                    <option>Community Event</option>
                    <option>Festival Celebration</option>
                    <option>Sports Event</option>
                    <option>Kids Carnival</option>
                    <option>RWA Event</option>
                    <option>Exhibition</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Event date
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                  />
                </label>

                <label>
                  Expected audience *
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Example: 500"
                    value={expectedAudience}
                    onChange={e => setExpectedAudience(e.target.value)}
                  />
                </label>

                <label>
                  Sponsorship amount required (₹) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="Example: 50000"
                    value={sponsorshipAmount}
                    onChange={e => setSponsorshipAmount(e.target.value)}
                  />
                </label>

                <label>
                  Purpose of sponsorship
                  <textarea
                    rows={3}
                    value={sponsorshipPurpose}
                    onChange={e => setSponsorshipPurpose(e.target.value)}
                    placeholder="Explain what the sponsorship will support..."
                  />
                </label>

                <label>
                  Benefits offered to sponsors
                  <textarea
                    rows={3}
                    value={sponsorBenefits}
                    onChange={e => setSponsorBenefits(e.target.value)}
                    placeholder="Example: Stall space, banners, branding..."
                  />
                </label>

                <label>
                  Proposal link (optional)
                  <input
                    type="url"
                    placeholder="https://..."
                    value={proposalUrl}
                    onChange={e => setProposalUrl(e.target.value)}
                  />
                </label>

                <button
                  className="button form-submit"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Submitting...' : 'Submit Sponsorship Request'}
                  <ArrowRight size={17} />
                </button>
              </form>
            </section>

            {/* SPONSORSHIP SUBMISSIONS */}
            <section style={{ marginTop: 32 }}>
              <span className="eyebrow">YOUR SUBMISSIONS</span>
              <h2>Sponsorship Requests Submitted</h2>

              {sponsorshipRequests.length === 0 ? (
                <div className="login-panel" style={{ marginTop: 16 }}>
                  <p>You have not submitted any sponsorship requests yet.</p>
                </div>
              ) : (
                <div className="format-grid" style={{ marginTop: 16 }}>
                  {sponsorshipRequests.map(request => (
                    <article className="format-card" key={request.id}>
                      <div className="format-icon"><Megaphone /></div>
                      <h3>{request.event_name}</h3>
                      <p>{request.event_type}</p>
                      <p>Expected audience: {request.expected_audience}</p>
                      <p>
                        Amount: ₹
                        {Number(request.sponsorship_amount).toLocaleString('en-IN')}
                      </p>
                      <p>
                        Status: <strong>
                          {request.approval_status === 'approved'
                            ? 'Approved'
                            : request.approval_status === 'rejected'
                              ? 'Rejected'
                              : 'Pending Admin Approval'}
                        </strong>
                      </p>
                      {request.admin_remarks && (
                        <p>Admin remarks: {request.admin_remarks}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* BRAND BOOKINGS */}
            <section style={{ marginTop: 32 }}>
              <span className="eyebrow">BRAND BOOKINGS</span>
              <h2>Booking Requests</h2>
              <p>
                Review booking requests submitted by brands for your society.
              </p>

              {bookingRequests.length === 0 ? (
                <div className="login-panel" style={{ marginTop: 16 }}>
                  <p>No booking requests received yet.</p>
                </div>
              ) : (
                <div className="format-grid" style={{ marginTop: 16 }}>
                  {bookingRequests.map(request => (
                    <article className="format-card" key={request.id}>
                      <div className="format-icon">
                        <Megaphone />
                      </div>

                      <h3>{request.campaign_name}</h3>

                      <p>
                        Booking type: <strong>{request.booking_type}</strong>
                      </p>

                      <p>Brand account: {request.brand_id}</p>

                      <p>
                        Campaign start: {request.campaign_start_date || 'Not specified'}
                      </p>

                      <p>
                        Campaign end: {request.campaign_end_date || 'Not specified'}
                      </p>

                      <p>Quantity: {request.quantity}</p>

                      <p>
                        Total amount: ₹
                        {Number(request.total_amount || 0).toLocaleString('en-IN')}
                      </p>

                      {request.brand_notes && (
                        <p>Brand notes: {request.brand_notes}</p>
                      )}

                      <p>
                        Admin status: <strong>{request.admin_status}</strong>
                      </p>

                      <p>
                        Society status: <strong>{request.society_status}</strong>
                      </p>

                      <p>
                        Overall status: <strong>{request.booking_status}</strong>
                      </p>

                      {request.admin_status === 'rejected' ||
                      request.society_status === 'rejected' ? (
                        <p><strong>This booking has been rejected.</strong></p>
                      ) : request.society_status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                          <button
                            className="button"
                            disabled={saving}
                            onClick={() =>
                              handleBookingDecision(request.id, 'approved')
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="button button-small"
                            disabled={saving}
                            onClick={() =>
                              handleBookingDecision(request.id, 'rejected')
                            }
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <p>
                          <strong>
                            {request.booking_status === 'approved'
                              ? 'Both Admin and Society have approved this booking.'
                              : 'Your decision has been submitted. Waiting for Admin approval.'}
                          </strong>
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

/* BRAND MARKETPLACE */

function SocietiesPage() {
  const [societies, setSocieties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSocieties() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setError('Supabase is not configured. Please check your .env file.')
          setLoading(false)
        }
        return
      }

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser()

        if (userError || !userData.user) {
          if (isMounted) {
            setError('Please log in with an approved brand account to browse societies.')
            setLoading(false)
          }
          return
        }

        const { data: brand, error: brandError } = await supabase
          .from('brands')
          .select('approval_status')
          .eq('id', userData.user.id)
          .maybeSingle()

        if (brandError || !brand) {
          if (isMounted) {
            setError('Your brand account could not be verified. Please contact support.')
            setLoading(false)
          }
          return
        }

        if (brand.approval_status !== 'approved') {
          if (isMounted) {
            setError(
              brand.approval_status === 'pending'
                ? 'Your brand account is awaiting administrator approval.'
                : 'Your brand account is not approved for marketplace access.'
            )
            setLoading(false)
          }
          return
        }

        const { data, error: fetchError } = await supabase
          .from('societies')
          .select('*')
          .order('society_name', { ascending: true })

        if (!isMounted) return

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setSocieties(data ?? [])
        }

        setLoading(false)
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load societies. Please try again.'
          )
          setLoading(false)
        }
      }
    }

    loadSocieties()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="login-page">
      <div className="login-top">
        <BrandMark />
        <Link to="/" className="back-link">
          <ArrowRight size={15} /> Back to home
        </Link>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <span className="eyebrow">ADSOCIETY MARKETPLACE</span>
        <h1>Societies</h1>
        <p>Explore residential communities listed on AdSociety.</p>

        {loading && <p>Checking your account and loading societies...</p>}

        {error && (
          <div className="login-panel" style={{ marginTop: 24 }}>
            <div className="form-notice" role="alert">{error}</div>
            <p style={{ marginTop: 16 }}>
              <Link to="/login" className="text-link">
                Go to login <ArrowRight size={16} />
              </Link>
            </p>
          </div>
        )}

        {!loading && !error && societies.length === 0 && (
          <div className="login-panel" style={{ marginTop: 24 }}>
            <h2>No societies found</h2>
            <p>
              Your account is approved, but there are currently no approved
              society listings available.
            </p>
          </div>
        )}

        {!loading && !error && societies.length > 0 && (
          <div className="format-grid" style={{ marginTop: 24 }}>
            {societies.map((society) => (
              <article
                className="format-card"
                key={society.id ?? society.society_name}
              >
                <div className="format-icon"><Building2 /></div>
                <h3>{society.society_name}</h3>
                <p>
                  {[society.city, society.state, society.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p>Total flats: {society.total_flats ?? 'Not provided'}</p>
                <p>Occupied flats: {society.occupied_flats ?? 'Not provided'}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

/* APPLICATION ROUTES */

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-society" element={<SocietyRegistration />} />
      <Route path="/register-brand" element={<BrandRegistration />} />
      <Route path="/societies" element={<SocietiesPage />} />
      <Route path="/brand-marketplace" element={<BrandMarketplace />} />
      <Route path="/society-dashboard" element={<SocietyDashboard />} />
      <Route path="/supabase-test" element={<SupabaseTest />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/brand-bookings" element={<BrandMyBookings />} />
      <Route path="*" element={<HomePage />} />
      <Route path="/brand-my-bookings" element={<BrandMyBookings />} />
    </Routes>
  )
}
