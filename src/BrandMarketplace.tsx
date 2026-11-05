
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, CalendarDays, MapPin, Megaphone,
  RefreshCw, ShieldCheck, X, Send, Search, Package,
  IndianRupee, CreditCard, ClipboardList
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Society = {
  id: string
  society_name: string
  city: string | null
  state: string | null
  pincode: string | null
  approval_status: string
}

type Inventory = {
  id: string
  society_id: string
  item_name: string
  category: string
  description: string | null
  rate: number
  rate_unit: string
  quantity: number
  location_details: string | null
  approval_status: string
  society?: Society | null
}

type Sponsorship = {
  id: string
  society_id: string
  event_name: string
  event_type: string
  event_date: string | null
  expected_audience: number | null
  sponsorship_amount: number | null
  purpose: string | null
  sponsor_benefits: string | null
  approval_status: string
  society?: Society | null
}

type Tab = 'inventory' | 'sponsorships' | 'bookings'

type BrandBooking = {
  id: string
  campaign_name: string
  booking_type: string
  total_amount: number
  admin_status: string
  society_status: string
  booking_status: string
  payment_status: string
  created_at: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
}

type BookingSelection = {
  type: 'inventory' | 'sponsorship'
  id: string
  society_id: string
  title: string
  amount: number
  rate_unit?: string
  available_quantity?: number
}

type BookingForm = {
  campaign_name: string
  campaign_start_date: string
  campaign_end_date: string
  quantity: number
  brand_notes: string
}

const initialBookingForm: BookingForm = {
  campaign_name: '',
  campaign_start_date: '',
  campaign_end_date: '',
  quantity: 1,
  brand_notes: '',
}

const money = (amount: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0))

function statusClass(status: string) {
  if (['approved', 'paid'].includes(status)) {
    return 'bg-emerald-50 text-emerald-700'
  }
  if (['rejected', 'failed', 'cancelled'].includes(status)) {
    return 'bg-red-50 text-red-700'
  }
  return 'bg-amber-50 text-amber-700'
}

function Status({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(value)}`}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}

export default function BrandMarketplace() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approved, setApproved] = useState(false)
  const [tab, setTab] = useState<Tab>('inventory')

  const [inventory, setInventory] = useState<Inventory[]>([])
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([])
  const [myBookings, setMyBookings] = useState<BrandBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [payingBookingId, setPayingBookingId] = useState('')
  const [paymentNotice, setPaymentNotice] = useState('')
  const [paymentError, setPaymentError] = useState('')

  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [pincodeFilter, setPincodeFilter] = useState('')

  const [bookingSelection, setBookingSelection] =
    useState<BookingSelection | null>(null)
  const [bookingForm, setBookingForm] =
    useState<BookingForm>(initialBookingForm)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingNotice, setBookingNotice] = useState('')
  const [bookingError, setBookingError] = useState('')

  async function loadMyBookings() {
    if (!supabase) return
    setBookingsLoading(true)
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('Please log in again.')
      }

      const { data, error: queryError } = await supabase
        .from('booking_requests')
        .select(
          'id, campaign_name, booking_type, total_amount, admin_status, society_status, booking_status, payment_status, created_at, razorpay_order_id, razorpay_payment_id'
        )
        .eq('brand_id', authData.user.id)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      setMyBookings((data ?? []) as BrandBooking[])
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : 'Unable to load bookings.'
      )
    } finally {
      setBookingsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadMarketplace() {
      setLoading(true)
      setError('')
      setApproved(false)

      try {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase is not configured. Please check your environment settings.')
        }

        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError || !authData.user) {
          throw new Error('Please log in with your brand account to continue.')
        }

        const { data: brand, error: brandError } = await supabase
          .from('brands')
          .select('approval_status')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (brandError) throw new Error(`Unable to verify brand approval: ${brandError.message}`)

        if (!brand || brand.approval_status !== 'approved') {
          throw new Error('Your brand account is awaiting Admin approval. Marketplace listings will be available after approval.')
        }

        const { data: societyData, error: societyError } = await supabase
          .from('societies')
          .select('id, society_name, city, state, pincode, approval_status')
          .eq('approval_status', 'approved')

        if (societyError) throw new Error(`Unable to load approved societies: ${societyError.message}`)

        const societies = (societyData ?? []) as Society[]
        const societyIds = societies.map((society) => society.id)

        let inventoryData: Inventory[] = []
        let sponsorshipData: Sponsorship[] = []

        const { data: bookingRows, error: bookingsError } = await supabase
          .from('booking_requests')
          .select(
            'id, campaign_name, booking_type, total_amount, admin_status, society_status, booking_status, payment_status, created_at, razorpay_order_id, razorpay_payment_id'
          )
          .eq('brand_id', authData.user.id)
          .order('created_at', { ascending: false })

        if (bookingsError) throw new Error(`Unable to load your bookings: ${bookingsError.message}`)

        if (societyIds.length > 0) {
          const [
            { data: inventoryRows, error: inventoryError },
            { data: sponsorshipRows, error: sponsorshipError },
          ] = await Promise.all([
            supabase
              .from('society_inventory')
              .select('id, society_id, item_name, category, description, rate, rate_unit, quantity, location_details, approval_status')
              .eq('approval_status', 'approved')
              .in('society_id', societyIds),
            supabase
              .from('sponsorship_requests')
              .select('id, society_id, event_name, event_type, event_date, expected_audience, sponsorship_amount, purpose, sponsor_benefits, approval_status')
              .eq('approval_status', 'approved')
              .in('society_id', societyIds),
          ])

          if (inventoryError) throw new Error(`Unable to load inventory: ${inventoryError.message}`)
          if (sponsorshipError) throw new Error(`Unable to load sponsorships: ${sponsorshipError.message}`)

          const societyMap = new Map(societies.map((society) => [society.id, society]))

          inventoryData = ((inventoryRows ?? []) as Inventory[]).map((item) => ({
            ...item,
            rate: Number(item.rate ?? 0),
            quantity: Number(item.quantity ?? 0),
            society: societyMap.get(item.society_id) ?? null,
          }))

          sponsorshipData = ((sponsorshipRows ?? []) as Sponsorship[]).map((item) => ({
            ...item,
            sponsorship_amount: item.sponsorship_amount == null ? null : Number(item.sponsorship_amount),
            expected_audience: item.expected_audience == null ? null : Number(item.expected_audience),
            society: societyMap.get(item.society_id) ?? null,
          }))
        }

        if (!cancelled) {
          setInventory(inventoryData)
          setSponsorships(sponsorshipData)
          setMyBookings((bookingRows ?? []) as BrandBooking[])
          setApproved(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong while loading the marketplace.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadMarketplace()
    return () => { cancelled = true }
  }, [])

  const states = useMemo(() => {
    const items = tab === 'inventory'
      ? inventory.map((item) => item.society)
      : sponsorships.map((item) => item.society)

    return [...new Set(
      items.map((society) => society?.state?.trim())
        .filter((value): value is string => Boolean(value))
    )].sort()
  }, [tab, inventory, sponsorships])

  const cities = useMemo(() => {
    const items = tab === 'inventory'
      ? inventory.map((item) => item.society)
      : sponsorships.map((item) => item.society)

    return [...new Set(
      items.filter((society) => !stateFilter || society?.state === stateFilter)
        .map((society) => society?.city?.trim())
        .filter((value): value is string => Boolean(value))
    )].sort()
  }, [tab, inventory, sponsorships, stateFilter])

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase()
    const areaQuery = areaFilter.trim().toLowerCase()
    const pinQuery = pincodeFilter.trim()

    return inventory.filter((item) => {
      const society = item.society
      const searchable = [
        item.item_name, item.category, item.description,
        item.location_details, society?.society_name,
        society?.city, society?.state, society?.pincode,
      ].filter(Boolean).join(' ').toLowerCase()

      return (!query || searchable.includes(query)) &&
        (!stateFilter || society?.state === stateFilter) &&
        (!cityFilter || society?.city === cityFilter) &&
        (!areaQuery ||
          (item.location_details ?? '').toLowerCase().includes(areaQuery) ||
          (society?.society_name ?? '').toLowerCase().includes(areaQuery)) &&
        (!pinQuery || (society?.pincode ?? '').includes(pinQuery))
    })
  }, [inventory, search, stateFilter, cityFilter, areaFilter, pincodeFilter])

  const filteredSponsorships = useMemo(() => {
    const query = search.trim().toLowerCase()
    const areaQuery = areaFilter.trim().toLowerCase()
    const pinQuery = pincodeFilter.trim()

    return sponsorships.filter((item) => {
      const society = item.society
      const searchable = [
        item.event_name, item.event_type, item.purpose,
        item.sponsor_benefits, society?.society_name,
        society?.city, society?.state, society?.pincode,
      ].filter(Boolean).join(' ').toLowerCase()

      return (!query || searchable.includes(query)) &&
        (!stateFilter || society?.state === stateFilter) &&
        (!cityFilter || society?.city === cityFilter) &&
        (!areaQuery || (society?.society_name ?? '').toLowerCase().includes(areaQuery)) &&
        (!pinQuery || (society?.pincode ?? '').includes(pinQuery))
    })
  }, [sponsorships, search, stateFilter, cityFilter, areaFilter, pincodeFilter])

  function resetFilters() {
    setSearch('')
    setStateFilter('')
    setCityFilter('')
    setAreaFilter('')
    setPincodeFilter('')
  }

  function openInventoryBooking(item: Inventory) {
    setBookingNotice('')
    setBookingError('')
    setBookingForm(initialBookingForm)
    setBookingSelection({
      type: 'inventory',
      id: item.id,
      society_id: item.society_id,
      title: item.item_name,
      amount: Number(item.rate ?? 0),
      rate_unit: item.rate_unit,
      available_quantity: Math.max(1, Number(item.quantity ?? 1)),
    })
  }

  function openSponsorshipBooking(item: Sponsorship) {
    setBookingNotice('')
    setBookingError('')
    setBookingForm(initialBookingForm)
    setBookingSelection({
      type: 'sponsorship',
      id: item.id,
      society_id: item.society_id,
      title: item.event_name,
      amount: Number(item.sponsorship_amount ?? 0),
    })
  }

  const calculatedAmount = bookingSelection
    ? bookingSelection.type === 'inventory'
      ? bookingSelection.amount * bookingForm.quantity
      : bookingSelection.amount
    : 0

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBookingNotice('')
    setBookingError('')

    if (!bookingSelection) return
    if (!isSupabaseConfigured || !supabase) {
      setBookingError('Supabase is not configured.')
      return
    }
    if (!bookingForm.campaign_name.trim()) {
      setBookingError('Please enter your campaign name.')
      return
    }
    if (bookingForm.campaign_start_date && bookingForm.campaign_end_date &&
      bookingForm.campaign_end_date < bookingForm.campaign_start_date) {
      setBookingError('The campaign end date cannot be before the start date.')
      return
    }
    if (bookingSelection.type === 'inventory' &&
      (bookingForm.quantity < 1 ||
        bookingForm.quantity > (bookingSelection.available_quantity ?? 1))) {
      setBookingError(`Please enter a quantity between 1 and ${bookingSelection.available_quantity ?? 1}.`)
      return
    }

    setBookingSubmitting(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) throw new Error('Your session has expired. Please log in again.')

      const { data: brand, error: brandError } = await supabase
        .from('brands').select('approval_status')
        .eq('id', authData.user.id).maybeSingle()

      if (brandError) throw new Error(`Unable to verify your brand: ${brandError.message}`)
      if (!brand || brand.approval_status !== 'approved') throw new Error('Only Admin-approved brands can request bookings.')

      const payload = {
        brand_id: authData.user.id,
        society_id: bookingSelection.society_id,
        inventory_id: bookingSelection.type === 'inventory' ? bookingSelection.id : null,
        sponsorship_id: bookingSelection.type === 'sponsorship' ? bookingSelection.id : null,
        booking_type: bookingSelection.type,
        campaign_name: bookingForm.campaign_name.trim(),
        campaign_start_date: bookingForm.campaign_start_date || null,
        campaign_end_date: bookingForm.campaign_end_date || null,
        quantity: bookingSelection.type === 'inventory' ? bookingForm.quantity : 1,
        total_amount: calculatedAmount,
        brand_notes: bookingForm.brand_notes.trim() || null,
        admin_status: 'pending',
        society_status: 'pending',
        booking_status: 'pending',
      }

      const { error: insertError } = await supabase.from('booking_requests').insert(payload)
      if (insertError) throw new Error(`Unable to submit booking: ${insertError.message}`)

      setBookingNotice('Booking request submitted successfully. It is now pending Admin and Society approval. Payment is not required at this stage.')
      setBookingSelection(null)
      setBookingForm(initialBookingForm)
      await loadMyBookings()
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Unable to submit your booking request.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  async function handlePayment(booking: BrandBooking) {
    if (!supabase) return
    setPaymentError('')
    setPaymentNotice('')
    setPayingBookingId(booking.id)

    try {
      const { data: orderData, error: orderError } =
        await supabase.functions.invoke('create-razorpay-order', {
          body: { booking_id: booking.id },
        })

      if (orderError) throw new Error(orderError.message || 'Unable to create payment order.')
      if (!orderData?.order_id || !orderData?.key_id) {
        throw new Error(orderData?.error || 'Payment order response is incomplete.')
      }

      const loadCheckout = () => new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        )
        if (existing) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'))
        document.body.appendChild(script)
      })

      await loadCheckout()

      const RazorpayConstructor = (window as any).Razorpay
      if (!RazorpayConstructor) throw new Error('Razorpay Checkout did not initialize.')

      const checkout = new RazorpayConstructor({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'AdSociety',
        description: booking.campaign_name,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const { error: verifyError } = await supabase!.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  booking_id: booking.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              }
            )
            if (verifyError) throw verifyError
            setPaymentNotice('Payment verified successfully. Your booking is now marked as paid.')
            await loadMyBookings()
          } catch (err) {
            setPaymentError(err instanceof Error ? err.message : 'Payment verification failed. Contact support before retrying.')
          } finally {
            setPayingBookingId('')
          }
        },
        modal: {
          ondismiss: () => setPayingBookingId(''),
        },
        theme: { color: '#4f46e5' },
      })

      checkout.on('payment.failed', (response: any) => {
        setPaymentError(response?.error?.description || 'Payment failed. You can retry after checking your booking status.')
        setPayingBookingId('')
      })
      checkout.open()
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Unable to start payment.')
      setPayingBookingId('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Loading marketplace</h2>
          <p className="mt-2 text-sm text-slate-500">Checking your account and approved listings...</p>
        </div>
      </div>
    )
  }

  if (error || !approved) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Marketplace access</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error || 'Your brand account must be approved before you can view listings.'}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white"><Building2 className="h-6 w-6" /></div>
            <div><h1 className="text-xl font-bold tracking-tight">AdSociety</h1><p className="text-xs text-slate-500">Brand Marketplace</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex"><ShieldCheck className="h-4 w-4" /> Approved brand</span>
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /> Home</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-7 text-white shadow-sm sm:p-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold"><ShieldCheck className="h-4 w-4" /> Verified community listings</span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Find the right audience for your brand.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Discover approved advertising inventory and sponsorship opportunities across residential communities. Submit a booking request and wait for Admin and Society approval before payment.</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-xl bg-white/10 px-4 py-3"><strong>{inventory.length}</strong> inventory listings</span>
              <span className="rounded-xl bg-white/10 px-4 py-3"><strong>{sponsorships.length}</strong> sponsorship opportunities</span>
              <span className="rounded-xl bg-white/10 px-4 py-3"><strong>{myBookings.length}</strong> my bookings</span>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-3 border-b border-slate-200">
            {(['inventory', 'sponsorships', 'bookings'] as Tab[]).map((item) => (
              <button key={item} type="button" onClick={() => setTab(item)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === item ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                {item === 'inventory' ? <Package className="h-4 w-4" /> : item === 'sponsorships' ? <Megaphone className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                {item === 'inventory' ? 'Advertising Inventory' : item === 'sponsorships' ? 'Sponsorships' : 'My Bookings'}
                {item === 'bookings' && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{myBookings.length}</span>}
              </button>
            ))}
          </div>

          {tab !== 'bookings' && (
            <>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4"><h3 className="font-semibold text-slate-900">Find opportunities</h3><p className="mt-1 text-sm text-slate-500">Search and filter approved listings by location.</p></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="relative block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Search</span><Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, category..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">State</span><select value={stateFilter} onChange={(event) => { setStateFilter(event.target.value); setCityFilter('') }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="">All states</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">City</span><select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="">All cities</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Area / Location</span><input value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} placeholder="Society or location" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                  <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">PIN code</span><input value={pincodeFilter} onChange={(event) => setPincodeFilter(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="Enter PIN" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">Showing <strong className="text-slate-800">{tab === 'inventory' ? filteredInventory.length : filteredSponsorships.length}</strong> {tab === 'inventory' ? 'inventory listings' : 'sponsorship opportunities'}</p>
                  <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Reset filters</button>
                </div>
              </div>

              {tab === 'inventory' && (
                <section className="mt-6">
                  {filteredInventory.length === 0 ? <EmptyState title="No inventory found" message="Try changing your search or location filters." /> : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {filteredInventory.map((item) => (
                        <article key={item.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Package className="h-5 w-5" /></div><Status value="approved" /></div>
                          <h3 className="mt-4 text-lg font-bold text-slate-900">{item.item_name}</h3>
                          <p className="mt-1 text-sm font-medium text-indigo-700">{item.category}</p>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{item.society?.society_name ?? 'Society'}</p>
                            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{[item.location_details, item.society?.city, item.society?.state, item.society?.pincode].filter(Boolean).join(', ') || 'Location not specified'}</p>
                          </div>
                          {item.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}
                          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                            <div><p className="text-xs text-slate-500">Rate</p><p className="mt-1 font-bold text-slate-900">{money(item.rate)}</p><p className="text-xs text-slate-500">{item.rate_unit || 'per unit'}</p></div>
                            <div><p className="text-xs text-slate-500">Available quantity</p><p className="mt-1 font-bold text-slate-900">{item.quantity}</p></div>
                          </div>
                          <button type="button" onClick={() => openInventoryBooking(item)} disabled={item.quantity < 1} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"><CalendarDays className="h-4 w-4" /> Request Booking</button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === 'sponsorships' && (
                <section className="mt-6">
                  {filteredSponsorships.length === 0 ? <EmptyState title="No sponsorships found" message="Try changing your search or location filters." /> : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {filteredSponsorships.map((item) => (
                        <article key={item.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Megaphone className="h-5 w-5" /></div><Status value="approved" /></div>
                          <h3 className="mt-4 text-lg font-bold text-slate-900">{item.event_name}</h3>
                          <p className="mt-1 text-sm font-medium text-violet-700">{item.event_type}</p>
                          <div className="mt-4 space-y-2 text-sm text-slate-600">
                            <p className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{item.society?.society_name ?? 'Society'}</p>
                            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{[item.society?.city, item.society?.state, item.society?.pincode].filter(Boolean).join(', ') || 'Location not specified'}</p>
                            {item.event_date && <p className="flex items-start gap-2"><CalendarDays className="h-4 w-4" />Event date: {new Date(`${item.event_date}T00:00:00`).toLocaleDateString('en-IN')}</p>}
                          </div>
                          {item.expected_audience != null && <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Expected audience</p><p className="mt-1 font-bold text-slate-900">{item.expected_audience.toLocaleString('en-IN')} people</p></div>}
                          {item.purpose && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Purpose</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.purpose}</p></div>}
                          {item.sponsor_benefits && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sponsor benefits</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.sponsor_benefits}</p></div>}
                          <div className="mt-auto pt-5">
                            <div className="mb-4 rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Requested sponsorship amount</p><p className="mt-1 text-xl font-bold text-slate-900">{item.sponsorship_amount == null ? 'Contact for details' : money(item.sponsorship_amount)}</p></div>
                            <button type="button" onClick={() => openSponsorshipBooking(item)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><CalendarDays className="h-4 w-4" /> Request Sponsorship</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {tab === 'bookings' && (
            <section className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-xl font-bold">My Booking Requests</h2><p className="mt-1 text-sm text-slate-500">Track approvals and payment for your campaigns.</p></div>
                <button type="button" onClick={() => void loadMyBookings()} disabled={bookingsLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${bookingsLoading ? 'animate-spin' : ''}`} /> Refresh</button>
              </div>

              {paymentError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{paymentError}</div>}
              {paymentNotice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{paymentNotice}</div>}

              {bookingsLoading ? <p className="rounded-xl bg-white p-8 text-center text-slate-500">Loading your bookings...</p> :
                myBookings.length === 0 ? <EmptyState title="No bookings yet" message="Submit a booking request from inventory or sponsorships. It will appear here." /> : (
                  <div className="space-y-4">
                    {myBookings.map((booking) => {
                      const canPay =
                        booking.admin_status === 'approved' &&
                        booking.society_status === 'approved' &&
                        ['approved', 'payment_pending'].includes(booking.booking_status) &&
                        booking.payment_status !== 'paid'

                      return (
                        <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div><h3 className="text-lg font-bold">{booking.campaign_name}</h3><p className="mt-1 text-xs text-slate-500">{booking.booking_type} · Requested {new Date(booking.created_at).toLocaleString('en-IN')}</p></div>
                            <p className="text-lg font-bold">{money(booking.total_amount)}</p>
                          </div>
                          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs text-slate-500">Admin approval</p><Status value={booking.admin_status} /></div>
                            <div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs text-slate-500">Society approval</p><Status value={booking.society_status} /></div>
                            <div className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs text-slate-500">Booking status</p><Status value={booking.booking_status} /></div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div><p className="text-xs text-slate-500">Payment status</p><div className="mt-1"><Status value={booking.payment_status || 'not_started'} /></div></div>
                            {booking.payment_status === 'paid' ? (
                              <span className="font-semibold text-emerald-700">Payment completed</span>
                            ) : canPay ? (
                              <button type="button" onClick={() => void handlePayment(booking)} disabled={payingBookingId === booking.id} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                                {payingBookingId === booking.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                {payingBookingId === booking.id ? 'Processing...' : 'Pay with Razorpay'}
                              </button>
                            ) : (
                              <p className="text-sm text-slate-500">{booking.booking_status === 'rejected' ? 'This request was rejected.' : 'Payment will unlock after both approvals.'}</p>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
            </section>
          )}
        </section>

        {tab !== 'bookings' && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
            <div><h3 className="text-sm font-semibold text-indigo-900">Booking approval process</h3><p className="mt-1 text-sm leading-6 text-indigo-800">Your request is sent for Admin and Society review. Both must approve it before payment can begin. Submitting a request does not charge you or confirm the booking.</p></div>
          </div>
        )}

        {bookingNotice && !bookingSelection && <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{bookingNotice}</div>}
      </main>

      {bookingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !bookingSubmitting) { setBookingSelection(null); setBookingError(''); setBookingNotice('') } }}>
          <div role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title" className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div><div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">{bookingSelection.type === 'inventory' ? <Package className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}{bookingSelection.type === 'inventory' ? 'Inventory booking request' : 'Sponsorship request'}</div><h2 id="booking-dialog-title" className="mt-2 text-xl font-bold text-slate-900">Request a booking</h2><p className="mt-1 text-sm text-slate-500">{bookingSelection.title}</p></div>
              <button type="button" aria-label="Close booking form" disabled={bookingSubmitting} onClick={() => { setBookingSelection(null); setBookingError(''); setBookingNotice('') }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>
            {bookingNotice ? (
              <div className="p-5 sm:p-6"><div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{bookingNotice}</div><button type="button" onClick={() => { setBookingSelection(null); setBookingNotice(''); setBookingError('') }} className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Back to marketplace</button></div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                <div className="space-y-5 p-5 sm:p-6">
                  {bookingError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{bookingError}</div>}
                  <div><label htmlFor="campaign_name" className="mb-1.5 block text-sm font-semibold text-slate-700">Campaign name *</label><input id="campaign_name" required maxLength={150} value={bookingForm.campaign_name} onChange={(event) => setBookingForm((current) => ({ ...current, campaign_name: event.target.value }))} placeholder="e.g. Diwali promotion campaign" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label htmlFor="campaign_start_date" className="mb-1.5 block text-sm font-semibold text-slate-700">Campaign start date</label><input id="campaign_start_date" type="date" value={bookingForm.campaign_start_date} onChange={(event) => setBookingForm((current) => ({ ...current, campaign_start_date: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500" /></div>
                    <div><label htmlFor="campaign_end_date" className="mb-1.5 block text-sm font-semibold text-slate-700">Campaign end date</label><input id="campaign_end_date" type="date" min={bookingForm.campaign_start_date || undefined} value={bookingForm.campaign_end_date} onChange={(event) => setBookingForm((current) => ({ ...current, campaign_end_date: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500" /></div>
                  </div>
                  {bookingSelection.type === 'inventory' && <div><label htmlFor="booking_quantity" className="mb-1.5 block text-sm font-semibold text-slate-700">Quantity *</label><input id="booking_quantity" type="number" required min={1} max={bookingSelection.available_quantity ?? 1} step={1} value={bookingForm.quantity} onChange={(event) => setBookingForm((current) => ({ ...current, quantity: Number(event.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500" /><p className="mt-1 text-xs text-slate-500">Available quantity: {bookingSelection.available_quantity ?? 1}</p></div>}
                  <div><label htmlFor="brand_notes" className="mb-1.5 block text-sm font-semibold text-slate-700">Additional requirements</label><textarea id="brand_notes" rows={3} maxLength={2000} value={bookingForm.brand_notes} onChange={(event) => setBookingForm((current) => ({ ...current, brand_notes: event.target.value }))} placeholder="Share campaign details or special requirements..." className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500" /></div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-950">Estimated amount</p><p className="mt-1 text-xs leading-5 text-indigo-700">{bookingSelection.type === 'inventory' ? `${money(bookingSelection.amount)} × ${bookingForm.quantity} ${bookingSelection.rate_unit || 'unit(s)'}` : 'Based on the listed sponsorship amount'}</p></div><p className="flex items-center gap-1 text-xl font-bold text-indigo-950"><IndianRupee className="h-5 w-5" />{calculatedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p></div><p className="mt-3 text-xs leading-5 text-indigo-800">This is a booking request, not a payment. The request must be approved by both Admin and Society before payment.</p></div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:px-6">
                  <button type="button" disabled={bookingSubmitting} onClick={() => { setBookingSelection(null); setBookingError(''); setBookingNotice('') }} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={bookingSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{bookingSubmitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit booking request</>}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <Search className="mx-auto h-9 w-9 text-slate-300" />
      <h3 className="mt-4 text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
    </div>
  )
}
