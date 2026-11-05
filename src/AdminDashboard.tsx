
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  RefreshCw,
  ShieldCheck,
  Megaphone,
  Layers3,
  Check,
  X,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Society = {
  id?: string | number
  society_name: string
  city: string | null
  state: string | null
  pincode: string | null
  total_flats: number | null
  occupied_flats: number | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  approval_status: string | null
}

type Brand = {
  id: string
  company_name: string
  contact_person: string
  contact_email: string
  contact_phone: string
  city: string | null
  gst_number: string | null
  yearly_marketing_budget: string | null
  website: string | null
  approval_status: string
  created_at?: string
}

type Inventory = {
  id: string
  society_id: string
  item_name: string
  category: string
  description: string | null
  quantity: number
  rate: number
  rate_unit: string
  location_details: string | null
  approval_status: string
  admin_remarks: string | null
  created_at: string
  societies?: {
    society_name: string
    city: string | null
    state: string | null
  } | null
}

type SponsorshipRequest = {
  id: string
  society_id: string
  event_name: string
  event_type: string
  event_date: string | null
  expected_audience: number
  sponsorship_amount: number
  purpose: string | null
  sponsor_benefits: string | null
  proposal_url: string | null
  approval_status: string
  admin_remarks: string | null
  created_at: string
  societies?: {
    society_name: string
    city: string | null
    state: string | null
  } | null
}

type BookingRequest = {
  id: string
  brand_id: string
  society_id: string
  inventory_id: string | null
  sponsorship_id: string | null
  booking_type: 'inventory' | 'sponsorship'
  campaign_name: string
  campaign_start_date: string | null
  campaign_end_date: string | null
  quantity: number
  total_amount: number
  brand_notes: string | null
  admin_status: 'pending' | 'approved' | 'rejected'
  society_status: 'pending' | 'approved' | 'rejected'
  booking_status: string
  created_at: string
  societies?: { society_name: string; city: string | null; state: string | null } | null
  brand_name?: string
  brand_email?: string
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all'
type DashboardTab = 'societies' | 'brands' | 'inventory' | 'sponsorships' | 'bookings'

export default function AdminDashboard() {
  const [societies, setSocieties] = useState<Society[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [sponsorships, setSponsorships] = useState<SponsorshipRequest[]>([])
  const [bookings, setBookings] = useState<BookingRequest[]>([])

  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<DashboardTab>('societies')
  const [societyFilter, setSocietyFilter] = useState<StatusFilter>('pending')
  const [brandFilter, setBrandFilter] = useState<StatusFilter>('pending')
  const [inventoryFilter, setInventoryFilter] = useState<StatusFilter>('pending')
  const [sponsorshipFilter, setSponsorshipFilter] = useState<StatusFilter>('pending')
  const [bookingFilter, setBookingFilter] = useState<StatusFilter>('pending')

  const loadRegistrations = useCallback(async () => {
    setLoading(true)
    setError('')
    setMessage('')

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Check your .env file.')
      setLoading(false)
      return
    }

    const [
      societyResult,
      brandResult,
      inventoryResult,
      sponsorshipResult,
      bookingResult,
    ] = await Promise.all([
      supabase
        .from('societies')
        .select('*')
        .order('society_name', { ascending: true }),

      supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('society_inventory')
        .select('*, societies(society_name, city, state)')
        .order('created_at', { ascending: false }),

      supabase
        .from('sponsorship_requests')
        .select('*, societies(society_name, city, state)')
        .order('created_at', { ascending: false }),

      supabase
        .from('booking_requests')
        .select('*, societies(society_name, city, state)')
        .order('created_at', { ascending: false }),
    ])

    if (societyResult.error) {
      setError(`Society registrations: ${societyResult.error.message}`)
    } else {
      setSocieties((societyResult.data ?? []) as Society[])
    }

    if (brandResult.error) {
      setError(previous =>
        previous
          ? `${previous} | Brand registrations: ${brandResult.error.message}`
          : `Brand registrations: ${brandResult.error.message}`
      )
    } else {
      setBrands((brandResult.data ?? []) as Brand[])
    }

    if (inventoryResult.error) {
      setError(previous =>
        previous
          ? `${previous} | Inventory: ${inventoryResult.error.message}`
          : `Inventory: ${inventoryResult.error.message}`
      )
    } else {
      setInventory((inventoryResult.data ?? []) as Inventory[])
    }

    if (sponsorshipResult.error) {
      setError(previous =>
        previous
          ? `${previous} | Sponsorships: ${sponsorshipResult.error.message}`
          : `Sponsorships: ${sponsorshipResult.error.message}`
      )
    } else {
      setSponsorships((sponsorshipResult.data ?? []) as SponsorshipRequest[])
    }

    if (bookingResult.error) {
      setError(previous =>
        previous
          ? `${previous} | Bookings: ${bookingResult.error.message}`
          : `Bookings: ${bookingResult.error.message}`
      )
    } else {
      const brandRows = (brandResult.data ?? []) as Brand[]
      const brandById = new Map(brandRows.map(brand => [brand.id, brand]))
      const bookingRows = (bookingResult.data ?? []) as BookingRequest[]
      setBookings(bookingRows.map(booking => {
        const brand = brandById.get(booking.brand_id)
        return {
          ...booking,
          brand_name: brand?.company_name || 'Brand details unavailable',
          brand_email: brand?.contact_email || '',
        }
      }))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadRegistrations()
  }, [loadRegistrations])

  async function updateSocietyStatus(
    society: Society,
    status: 'approved' | 'rejected'
  ) {
    if (!supabase) return

    if (!window.confirm(`Are you sure you want to mark "${society.society_name}" as ${status}?`)) return

    const id = `society-${society.id ?? society.society_name}`
    setBusyId(id)
    setMessage('')
    setError('')

    let query = supabase.from('societies').update({ approval_status: status })

    if (society.id !== undefined && society.id !== null) {
      query = query.eq('id', society.id)
    } else {
      query = query.eq('society_name', society.society_name)
    }

    const { error: updateError } = await query
    setBusyId('')

    if (updateError) {
      setError(`Could not update society: ${updateError.message}`)
      return
    }

    setMessage(`${society.society_name} marked ${status}.`)
    await loadRegistrations()
  }

  async function updateBrandStatus(
    brand: Brand,
    status: 'approved' | 'rejected'
  ) {
    if (!supabase) return

    if (!window.confirm(`Are you sure you want to ${status} "${brand.company_name}"?`)) return

    const id = `brand-${brand.id}`
    setBusyId(id)
    setMessage('')
    setError('')

    const { error: updateError } = await supabase
      .from('brands')
      .update({ approval_status: status })
      .eq('id', brand.id)

    setBusyId('')

    if (updateError) {
      setError(`Could not update brand: ${updateError.message}`)
      return
    }

    setMessage(`${brand.company_name} marked ${status}.`)
    await loadRegistrations()
  }

  async function updateInventoryStatus(
    item: Inventory,
    status: 'approved' | 'rejected'
  ) {
    if (!supabase) return

    let remarks = ''

    if (status === 'rejected') {
      const enteredRemarks = window.prompt(`Enter rejection remarks for "${item.item_name}":`)
      if (enteredRemarks === null) return

      remarks = enteredRemarks.trim()

      if (!remarks) {
        setError('Please enter a reason before rejecting inventory.')
        return
      }
    } else if (!window.confirm(`Are you sure you want to approve "${item.item_name}"?`)) {
      return
    }

    const id = `inventory-${item.id}`
    setBusyId(id)
    setMessage('')
    setError('')

    const { error: updateError } = await supabase
      .from('society_inventory')
      .update({
        approval_status: status,
        admin_remarks: status === 'rejected' ? remarks : null,
      })
      .eq('id', item.id)

    setBusyId('')

    if (updateError) {
      setError(`Could not update inventory: ${updateError.message}`)
      return
    }

    setMessage(`"${item.item_name}" marked ${status}.`)
    await loadRegistrations()
  }

  async function updateSponsorshipStatus(
    item: SponsorshipRequest,
    status: 'approved' | 'rejected'
  ) {
    if (!supabase) return

    let remarks = ''

    if (status === 'rejected') {
      const enteredRemarks = window.prompt(
        `Enter rejection remarks for "${item.event_name}":`
      )

      if (enteredRemarks === null) return

      remarks = enteredRemarks.trim()

      if (!remarks) {
        setError('Please enter a reason before rejecting a sponsorship request.')
        return
      }
    } else if (!window.confirm(`Approve sponsorship request for "${item.event_name}"?`)) {
      return
    }

    const id = `sponsorship-${item.id}`
    setBusyId(id)
    setMessage('')
    setError('')

    const { error: updateError } = await supabase
      .from('sponsorship_requests')
      .update({
        approval_status: status,
        admin_remarks: status === 'rejected' ? remarks : null,
      })
      .eq('id', item.id)

    setBusyId('')

    if (updateError) {
      setError(`Could not update sponsorship request: ${updateError.message}`)
      return
    }

    setMessage(`Sponsorship request "${item.event_name}" marked ${status}.`)
    await loadRegistrations()
  }

  async function updateBookingAdminStatus(
    booking: BookingRequest,
    status: 'approved' | 'rejected'
  ) {
    if (!supabase) return
    if (!window.confirm(`Are you sure you want to ${status} this booking request?`)) return

    setBusyId(`booking-${booking.id}`)
    setMessage('')
    setError('')

    const { error: updateError } = await supabase
      .from('booking_requests')
      .update({ admin_status: status })
      .eq('id', booking.id)

    setBusyId('')
    if (updateError) {
      setError(`Could not update booking: ${updateError.message}`)
      return
    }

    setMessage(`Admin ${status} recorded. Society approval is still required before the booking is fully approved.`)
    await loadRegistrations()
  }

  const visibleSocieties = societies.filter(item =>
    societyFilter === 'all' ||
    (item.approval_status || 'pending').toLowerCase() === societyFilter
  )

  const visibleBrands = brands.filter(item =>
    brandFilter === 'all' ||
    (item.approval_status || 'pending').toLowerCase() === brandFilter
  )

  const visibleInventory = inventory.filter(item =>
    inventoryFilter === 'all' ||
    (item.approval_status || 'pending').toLowerCase() === inventoryFilter
  )

  const visibleSponsorships = sponsorships.filter(item =>
    sponsorshipFilter === 'all' ||
    (item.approval_status || 'pending').toLowerCase() === sponsorshipFilter
  )

  const societyPending = societies.filter(item => (item.approval_status || 'pending').toLowerCase() === 'pending').length
  const brandPending = brands.filter(item => (item.approval_status || 'pending').toLowerCase() === 'pending').length
  const inventoryPending = inventory.filter(item => (item.approval_status || 'pending').toLowerCase() === 'pending').length
  const sponsorshipPending = sponsorships.filter(item => (item.approval_status || 'pending').toLowerCase() === 'pending').length
  const bookingPending = bookings.filter(item => item.admin_status === 'pending').length

  const activeFilter =
    activeTab === 'societies' ? societyFilter :
    activeTab === 'brands' ? brandFilter :
    activeTab === 'inventory' ? inventoryFilter :
    activeTab === 'sponsorships' ? sponsorshipFilter :
    bookingFilter

  function handleFilterChange(value: StatusFilter) {
    if (activeTab === 'societies') setSocietyFilter(value)
    else if (activeTab === 'brands') setBrandFilter(value)
    else if (activeTab === 'inventory') setInventoryFilter(value)
    else if (activeTab === 'sponsorships') setSponsorshipFilter(value)
    else setBookingFilter(value)
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

      <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <span className="eyebrow"><ShieldCheck size={14} /> ADMIN WORKSPACE</span>
        <h1>Admin dashboard</h1>
        <p>Manage society registrations, brands, advertising inventory and sponsorship requests.</p>

        <div className="audience-grid" style={{ marginTop: 24 }}>
          <article className="format-card">
            <span className="card-kicker">TOTAL SOCIETIES</span>
            <h2>{societies.length}</h2>
            <p>{societyPending} awaiting review</p>
          </article>
          <article className="format-card">
            <span className="card-kicker">TOTAL BRANDS</span>
            <h2>{brands.length}</h2>
            <p>{brandPending} awaiting review</p>
          </article>
          <article className="format-card">
            <span className="card-kicker">TOTAL INVENTORY</span>
            <h2>{inventory.length}</h2>
            <p>{inventoryPending} awaiting approval</p>
          </article>
          <article className="format-card">
            <span className="card-kicker">SPONSORSHIP REQUESTS</span>
            <h2>{sponsorships.length}</h2>
            <p>{sponsorshipPending} awaiting review</p>
          </article>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
          <button className={activeTab === 'societies' ? 'button' : 'button button-ghost'} onClick={() => { setActiveTab('societies'); setMessage(''); setError('') }}>
            <Building2 size={16} /> Society Approvals ({societyPending})
          </button>
          <button className={activeTab === 'brands' ? 'button' : 'button button-ghost'} onClick={() => { setActiveTab('brands'); setMessage(''); setError('') }}>
            <Megaphone size={16} /> Brand Approvals ({brandPending})
          </button>
          <button className={activeTab === 'inventory' ? 'button' : 'button button-ghost'} onClick={() => { setActiveTab('inventory'); setMessage(''); setError('') }}>
            <Layers3 size={16} /> Inventory Approvals ({inventoryPending})
          </button>
          <button className={activeTab === 'sponsorships' ? 'button' : 'button button-ghost'} onClick={() => { setActiveTab('sponsorships'); setMessage(''); setError('') }}>
            <Megaphone size={16} /> Sponsorship Approvals ({sponsorshipPending})
          </button>
          <button className={activeTab === 'bookings' ? 'button' : 'button button-ghost'} onClick={() => { setActiveTab('bookings'); setMessage(''); setError('') }}>
            <Check size={16} /> Booking Approvals ({bookingPending})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginTop: 24 }}>
          <label>
            Show
            <select value={activeFilter} onChange={event => handleFilterChange(event.target.value as StatusFilter)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All registrations</option>
            </select>
          </label>
          <button className="button button-ghost" onClick={() => void loadRegistrations()} disabled={loading}>
            <RefreshCw size={16} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {message && <p className="form-notice" role="status">{message}</p>}
        {error && <p className="form-notice" role="alert">{error}</p>}
        {loading && <p>Loading dashboard data...</p>}

        {!loading && activeTab === 'societies' && (
          <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            {visibleSocieties.length === 0 && <div className="login-panel"><h2>No societies in this filter</h2><p>Try another filter or refresh.</p></div>}
            {visibleSocieties.map((item, index) => {
              const status = (item.approval_status || 'pending').toLowerCase()
              const id = `society-${item.id ?? item.society_name}`
              return (
                <article className="login-panel" key={item.id ?? `${item.society_name}-${index}`}>
                  <span className="card-kicker">SOCIETY REGISTRATION</span>
                  <h2>{item.society_name}</h2>
                  <p>{[item.city, item.state, item.pincode].filter(Boolean).join(', ')}</p>
                  <p>Status: <strong>{status}</strong></p>
                  <p>Total flats: {item.total_flats ?? '—'} · Occupied flats: {item.occupied_flats ?? '—'}</p>
                  <p>Contact: {item.contact_person || '—'} · {item.contact_email || '—'} · {item.contact_phone || '—'}</p>
                  {status === 'pending' && <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                    <button className="button" disabled={busyId === id} onClick={() => void updateSocietyStatus(item, 'approved')}>{busyId === id ? 'Updating...' : 'Approve society'}</button>
                    <button className="button button-ghost" disabled={busyId === id} onClick={() => void updateSocietyStatus(item, 'rejected')}>Reject</button>
                  </div>}
                </article>
              )
            })}
          </div>
        )}

        {!loading && activeTab === 'brands' && (
          <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            {visibleBrands.length === 0 && <div className="login-panel"><h2>No brands in this filter</h2><p>Try another filter or refresh.</p></div>}
            {visibleBrands.map(item => {
              const status = (item.approval_status || 'pending').toLowerCase()
              const id = `brand-${item.id}`
              return (
                <article className="login-panel" key={item.id}>
                  <span className="card-kicker">BRAND REGISTRATION</span>
                  <h2>{item.company_name}</h2>
                  <p>City: {item.city || '—'} · Status: <strong>{status}</strong></p>
                  <p>Contact person: {item.contact_person || '—'}</p>
                  <p>Email: {item.contact_email || '—'}</p>
                  <p>Phone: {item.contact_phone || '—'}</p>
                  <p>GST number: {item.gst_number || '—'}</p>
                  <p>Yearly marketing budget: {item.yearly_marketing_budget || '—'}</p>
                  <p>Website: {item.website ? <a href={item.website} target="_blank" rel="noreferrer">{item.website}</a> : '—'}</p>
                  {status === 'pending' && <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                    <button className="button" disabled={busyId === id} onClick={() => void updateBrandStatus(item, 'approved')}>{busyId === id ? 'Updating...' : 'Approve brand'}</button>
                    <button className="button button-ghost" disabled={busyId === id} onClick={() => void updateBrandStatus(item, 'rejected')}>Reject</button>
                  </div>}
                </article>
              )
            })}
          </div>
        )}

        {!loading && activeTab === 'inventory' && (
          <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            {visibleInventory.length === 0 && <div className="login-panel"><h2>No inventory in this filter</h2><p>Try another filter or refresh.</p></div>}
            {visibleInventory.map(item => {
              const status = (item.approval_status || 'pending').toLowerCase()
              const id = `inventory-${item.id}`
              return (
                <article className="login-panel" key={item.id}>
                  <span className="card-kicker">SOCIETY ADVERTISING INVENTORY</span>
                  <h2>{item.item_name}</h2>
                  <p>Category: {item.category} · Status: <strong>{status}</strong></p>
                  <p>Society: {item.societies?.society_name || 'Society details unavailable'}</p>
                  <p>City: {item.societies?.city || '—'} · {item.societies?.state || '—'}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Rate: ₹{Number(item.rate).toLocaleString('en-IN')} {item.rate_unit}</p>
                  <p>Location: {item.location_details || 'Not specified'}</p>
                  <p>Description: {item.description || 'Not provided'}</p>
                  <p>Submitted: {new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                  {item.admin_remarks && <p><strong>Admin remarks:</strong> {item.admin_remarks}</p>}
                  {status === 'pending' && <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                    <button className="button" disabled={busyId === id} onClick={() => void updateInventoryStatus(item, 'approved')}><Check size={16} /> {busyId === id ? 'Updating...' : 'Approve inventory'}</button>
                    <button className="button button-ghost" disabled={busyId === id} onClick={() => void updateInventoryStatus(item, 'rejected')}><X size={16} /> Reject inventory</button>
                  </div>}
                </article>
              )
            })}
          </div>
        )}

        {!loading && activeTab === 'sponsorships' && (
          <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            {visibleSponsorships.length === 0 && <div className="login-panel"><h2>No sponsorship requests in this filter</h2><p>Try selecting All registrations or refresh the list.</p></div>}
            {visibleSponsorships.map(item => {
              const status = (item.approval_status || 'pending').toLowerCase()
              const id = `sponsorship-${item.id}`
              return (
                <article className="login-panel" key={item.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <span className="card-kicker">SOCIETY SPONSORSHIP REQUEST</span>
                      <h2>{item.event_name}</h2>
                      <p>{item.event_type}</p>
                    </div>
                    <strong>Status: {status}</strong>
                  </div>
                  <p><strong>Society:</strong> {item.societies?.society_name || 'Society details unavailable'}</p>
                  <p><strong>Location:</strong> {item.societies?.city || '—'} · {item.societies?.state || '—'}</p>
                  <p><strong>Event date:</strong> {item.event_date ? new Date(`${item.event_date}T00:00:00`).toLocaleDateString('en-IN') : 'Not specified'}</p>
                  <p><strong>Expected audience:</strong> {Number(item.expected_audience || 0).toLocaleString('en-IN')}</p>
                  <p><strong>Sponsorship amount:</strong> ₹{Number(item.sponsorship_amount || 0).toLocaleString('en-IN')}</p>
                  <p><strong>Purpose:</strong> {item.purpose || 'Not provided'}</p>
                  <p><strong>Benefits for sponsor:</strong> {item.sponsor_benefits || 'Not provided'}</p>
                  {item.proposal_url && <p><strong>Proposal:</strong> <a href={item.proposal_url} target="_blank" rel="noreferrer">Open proposal</a></p>}
                  <p><strong>Submitted:</strong> {new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                  {item.admin_remarks && <p><strong>Admin remarks:</strong> {item.admin_remarks}</p>}
                  {status === 'pending' && <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                    <button className="button" disabled={busyId === id} onClick={() => void updateSponsorshipStatus(item, 'approved')}><Check size={16} /> {busyId === id ? 'Updating...' : 'Approve request'}</button>
                    <button className="button button-ghost" disabled={busyId === id} onClick={() => void updateSponsorshipStatus(item, 'rejected')}><X size={16} /> Reject request</button>
                  </div>}
                </article>
              )
            })}
          </div>
        )}

        {!loading && activeTab === 'bookings' && (
          <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
            {bookings.filter(item => bookingFilter === 'all' || item.admin_status === bookingFilter).length === 0 && (
              <div className="login-panel"><h2>No booking requests in this filter</h2><p>Try another filter or refresh.</p></div>
            )}
            {bookings.filter(item => bookingFilter === 'all' || item.admin_status === bookingFilter).map(item => {
              const id = `booking-${item.id}`
              return (
                <article className="login-panel" key={item.id}>
                  <span className="card-kicker">BRAND BOOKING REQUEST · {item.booking_type.toUpperCase()}</span>
                  <h2>{item.campaign_name}</h2>
                  <p><strong>Brand:</strong> {item.brand_name} {item.brand_email ? `· ${item.brand_email}` : ''}</p>
                  <p><strong>Society:</strong> {item.societies?.society_name || 'Society details unavailable'} · {item.societies?.city || '—'} · {item.societies?.state || '—'}</p>
                  <p><strong>Campaign dates:</strong> {item.campaign_start_date || 'Not specified'} to {item.campaign_end_date || 'Not specified'}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Estimated amount:</strong> ₹{Number(item.total_amount || 0).toLocaleString('en-IN')}</p>
                  {item.brand_notes && <p><strong>Brand notes:</strong> {item.brand_notes}</p>}
                  <p><strong>Admin status:</strong> {item.admin_status} · <strong>Society status:</strong> {item.society_status}</p>
                  <p><strong>Overall booking status:</strong> {item.booking_status}</p>
                  <p><strong>Submitted:</strong> {new Date(item.created_at).toLocaleDateString('en-IN')}</p>
                  {item.admin_status === 'pending' && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                      <button className="button" disabled={busyId === id} onClick={() => void updateBookingAdminStatus(item, 'approved')}><Check size={16} /> {busyId === id ? 'Updating...' : 'Approve booking'}</button>
                      <button className="button button-ghost" disabled={busyId === id} onClick={() => void updateBookingAdminStatus(item, 'rejected')}><X size={16} /> Reject booking</button>
                    </div>
                  )}
                  {item.admin_status === 'approved' && item.society_status === 'pending' && <p><strong>Next:</strong> Waiting for Society approval. Payment is not available yet.</p>}
                  {item.booking_status === 'approved' && <p><strong>Ready for next step:</strong> Both Admin and Society have approved. Payment can be implemented in the next stage.</p>}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
