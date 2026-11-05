
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Wallet,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Booking = {
  id: string
  campaign_name: string
  booking_type: string
  campaign_start_date: string | null
  campaign_end_date: string | null
  quantity: number
  total_amount: number | string
  admin_status: string
  society_status: string
  booking_status: string
  payment_status: string
  razorpay_order_id: string | null
  created_at: string
}

function formatStatus(value: string | null | undefined) {
  return (value || 'unknown').replace(/_/g, ' ')
}

function statusColor(value: string) {
  if (['approved', 'paid'].includes(value)) return '#15803d'
  if (['rejected', 'failed', 'cancelled'].includes(value)) return '#b91c1c'
  return '#a16207'
}

export default function BrandMyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadBookings(showRefresh = false) {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured.')
      setLoading(false)
      setRefreshing(false)
      return
    }

    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        setError('Please log in with your approved brand account.')
        return
      }

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('approval_status')
        .eq('id', userData.user.id)
        .maybeSingle()

      if (brandError || brand?.approval_status !== 'approved') {
        setError('Your brand account must be approved to view bookings.')
        return
      }

      const { data, error: queryError } = await supabase
        .from('booking_requests')
        .select(
          'id, campaign_name, booking_type, campaign_start_date, campaign_end_date, quantity, total_amount, admin_status, society_status, booking_status, payment_status, razorpay_order_id, created_at'
        )
        .eq('brand_id', userData.user.id)
        .order('created_at', { ascending: false })

      if (queryError) {
        setError(`Could not load bookings: ${queryError.message}`)
        return
      }

      setBookings((data ?? []) as Booking[])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load bookings.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [])

  async function handlePay(booking: Booking) {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setError('')
    setNotice('')

    // Both approvals are mandatory.
    // Existing payment_pending orders are also allowed.
    const eligibleForPayment =
      booking.admin_status === 'approved' &&
      booking.society_status === 'approved' &&
      ['approved', 'payment_pending'].includes(booking.booking_status) &&
      booking.payment_status !== 'paid'

    if (!eligibleForPayment) {
      setError(
        'Payment is available only after both Admin and Society approve.'
      )
      return
    }

    setPayingId(booking.id)

    try {
      const { data: orderData, error: orderError } =
        await supabase.functions.invoke('create-razorpay-order', {
          body: { booking_id: booking.id },
        })

      if (orderError) {
        let detail = orderError.message

        try {
          const response = (orderError as { context?: Response }).context

          if (response) {
            const body = await response.clone().json()
            if (body?.error) detail = body.error
          }
        } catch {
          // Keep the original error message.
        }

        throw new Error(detail || 'Could not create the Razorpay order.')
      }

      if (!orderData?.order_id || !orderData?.key_id) {
        throw new Error(
          orderData?.error || 'Razorpay did not return a valid order.'
        )
      }

      const loadRazorpayScript = () =>
        new Promise<boolean>((resolve) => {
          if (window.Razorpay) {
            resolve(true)
            return
          }

          const existing = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
          )

          if (existing) {
            existing.addEventListener(
              'load',
              () => resolve(true),
              { once: true }
            )
            existing.addEventListener(
              'error',
              () => resolve(false),
              { once: true }
            )
            return
          }

          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve(true)
          script.onerror = () => resolve(false)
          document.body.appendChild(script)
        })

      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          'Could not load Razorpay Checkout. Check your internet connection and try again.'
        )
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'AdSociety',
        description: booking.campaign_name,
        order_id: orderData.order_id,
        prefill: {},
        notes: { booking_id: booking.id },
        theme: { color: '#4f46e5' },

        modal: {
          ondismiss: () => {
            setPayingId(null)
            setNotice(
              'Payment window closed. If payment was not completed, you can try again.'
            )
            void loadBookings(true)
          },
        },

        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            if (!supabase) {
              throw new Error('Supabase is not configured.')
            }

            const { data: verifyData, error: verifyError } =
              await supabase.functions.invoke(
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

            if (verifyError) {
              let detail = verifyError.message

              try {
                const responseContext = (
                  verifyError as { context?: Response }
                ).context

                if (responseContext) {
                  const body = await responseContext.clone().json()
                  if (body?.error) detail = body.error
                }
              } catch {
                // Keep the available error message.
              }

              throw new Error(detail || 'Payment verification failed.')
            }

            if (verifyData?.error) {
              throw new Error(verifyData.error)
            }

            setNotice(
              'Payment verified successfully. Your booking is now marked as paid.'
            )

            await loadBookings(true)
          } catch (err) {
            setError(
              err instanceof Error
                ? `Payment verification needs attention: ${err.message}`
                : 'Payment verification needs attention. Please refresh and check your booking status.'
            )
          } finally {
            setPayingId(null)
          }
        },
      }

      const checkout = new window.Razorpay(options)

      checkout.on(
        'payment.failed',
        (response: { error?: { description?: string } }) => {
          setPayingId(null)
          setError(
            response.error?.description ||
              'Payment failed. Refresh your bookings before attempting another payment.'
          )
        }
      )

      checkout.open()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to start payment.'
      )
      setPayingId(null)
    }
  }

  return (
    <main className="login-page">
      <div className="login-top">
        <Link to="/brand-marketplace" className="back-link">
          <ArrowLeft size={16} /> Back to marketplace
        </Link>
      </div>

      <div
        className="container"
        style={{ paddingTop: 40, paddingBottom: 64 }}
      >
        <span className="eyebrow">BRAND PORTAL</span>
        <h1>My Bookings</h1>
        <p>
          Track approvals and pay securely after both Admin and Society approve.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            margin: '24px 0',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="button"
            onClick={() => void loadBookings(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh bookings'}
          </button>

          <Link to="/brand-marketplace" className="button button-ghost">
            Browse marketplace
          </Link>
        </div>

        {error && (
          <div
            className="form-notice"
            role="alert"
            style={{ marginBottom: 16 }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              padding: 14,
              marginBottom: 16,
              borderRadius: 8,
              background: '#e8f7ed',
              color: '#176b36',
            }}
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div className="login-panel">
            <p>Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="login-panel">
            <h2>No bookings yet</h2>
            <p>Your marketplace booking requests will appear here.</p>
            <Link to="/brand-marketplace" className="text-link">
              Find advertising spaces <ArrowLeft size={15} />
            </Link>
          </div>
        ) : (
          <div className="format-grid">
            {bookings.map((booking) => {
              const eligibleForPayment =
                booking.admin_status === 'approved' &&
                booking.society_status === 'approved' &&
                ['approved', 'payment_pending'].includes(
                  booking.booking_status
                ) &&
                booking.payment_status !== 'paid'

              const paid =
                booking.payment_status === 'paid' ||
                booking.booking_status === 'paid'

              return (
                <article className="format-card" key={booking.id}>
                  <div className="format-icon">
                    <Wallet />
                  </div>

                  <h3>{booking.campaign_name}</h3>

                  <p>Booking reference: {booking.id}</p>
                  <p>Type: {formatStatus(booking.booking_type)}</p>
                  <p>Quantity: {booking.quantity}</p>

                  <p>
                    Amount: ₹
                    {Number(booking.total_amount || 0).toLocaleString('en-IN')}
                  </p>

                  <p>
                    <CalendarDays size={15} /> Start:{' '}
                    {booking.campaign_start_date || 'Not specified'}
                  </p>

                  <p>
                    End: {booking.campaign_end_date || 'Not specified'}
                  </p>

                  <p>
                    Admin approval:{' '}
                    <strong
                      style={{ color: statusColor(booking.admin_status) }}
                    >
                      {formatStatus(booking.admin_status)}
                    </strong>
                  </p>

                  <p>
                    Society approval:{' '}
                    <strong
                      style={{ color: statusColor(booking.society_status) }}
                    >
                      {formatStatus(booking.society_status)}
                    </strong>
                  </p>

                  <p>
                    Booking status:{' '}
                    <strong
                      style={{ color: statusColor(booking.booking_status) }}
                    >
                      {formatStatus(booking.booking_status)}
                    </strong>
                  </p>

                  <p>
                    Payment status:{' '}
                    <strong
                      style={{ color: statusColor(booking.payment_status) }}
                    >
                      {formatStatus(booking.payment_status)}
                    </strong>
                  </p>

                  {paid ? (
                    <p style={{ color: '#15803d', fontWeight: 700 }}>
                      <ShieldCheck size={17} /> Payment confirmed
                    </p>
                  ) : eligibleForPayment ? (
                    <button
                      className="button form-submit"
                      disabled={payingId !== null}
                      onClick={() => void handlePay(booking)}
                      style={{ marginTop: 14 }}
                    >
                      <Wallet size={16} />
                      {payingId === booking.id
                        ? 'Opening payment...'
                        : 'Pay Now with Razorpay'}
                    </button>
                  ) : (
                    <p style={{ marginTop: 14 }}>
                      {booking.booking_status === 'rejected'
                        ? 'This booking request was rejected.'
                        : 'Payment will be available after both approvals are complete.'}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (
        event: string,
        callback: (response: any) => void
      ) => void
    }
  }
}
