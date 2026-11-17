
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Wallet,
  ShieldCheck,
  FileText,
  Upload,
  Building2,
  Download,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Campaign = {
  id: string
  campaign_name: string
  campaign_status: string
  base_amount: number | string | null
  gst_amount: number | string | null
  commission_amount: number | string | null
  total_amount: number | string | null
  created_at: string
}

type CampaignItem = {
  id: string
  campaign_id: string
  society_id: string
  item_name: string
  category: string | null
  item_type: string
  quantity: number
  rate: number | string
  rate_unit: string | null
  campaign_start_date: string | null
  campaign_end_date: string | null
  base_amount: number | string
  gst_amount: number | string
  commission_amount: number | string
  total_amount: number | string
  admin_status: string
  society_status: string
  item_status: string
}

type CampaignPayment = {
  id: string
  campaign_id: string
  payment_status: string
  base_amount: number | string
  gst_amount: number | string
  total_amount: number | string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  paid_at: string | null
}

type PurchaseOrder = {
  id: string
  campaign_id: string
  po_type: string
  po_status: string
  po_number: string | null
  po_date: string | null
  document_url: string | null
  admin_remarks: string | null
  created_at: string
}

type CampaignInvoice = {
  id: string
  campaign_id: string
  invoice_type: string
  invoice_number: string
  base_amount: number | string
  gst_rate: number | string
  gst_amount: number | string
  total_amount: number | string
  invoice_date: string
  invoice_status: string
}

function formatStatus(value: string | null | undefined) {
  return (value || 'unknown').replace(/_/g, ' ')
}

function statusColor(value: string | null | undefined) {
  const status = (value || '').toLowerCase()

  if (
    ['approved', 'paid', 'confirmed', 'generated', 'captured'].includes(status)
  ) {
    return '#15803d'
  }

  if (['rejected', 'failed', 'cancelled'].includes(status)) {
    return '#b91c1c'
  }

  return '#a16207'
}

function money(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

function poTypeLabel(value: string) {
  if (value === 'adsociety_generated') return 'AdSociety-generated PO'
  if (value === 'brand_uploaded') return 'Brand-uploaded PO'
  if (value === 'direct_payment') return 'Direct payment'
  return formatStatus(value)
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[character]
  })
}

export default function BrandMyBookings() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [items, setItems] = useState<CampaignItem[]>([])
  const [payments, setPayments] = useState<CampaignPayment[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [invoices, setInvoices] = useState<CampaignInvoice[]>([])
  const [poLinks, setPoLinks] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [poActionId, setPoActionId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const [poFiles, setPoFiles] = useState<Record<string, File | null>>({})
  const [poNumbers, setPoNumbers] = useState<Record<string, string>>({})
  const [poDates, setPoDates] = useState<Record<string, string>>({})

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [campaignView, setCampaignView] = useState<'pending' | 'approved' | 'rejected'>('pending')

  async function loadCampaigns(showRefresh = false) {
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

      const userId = userData.user.id

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('approval_status')
        .eq('id', userId)
        .maybeSingle()

      if (brandError || brand?.approval_status !== 'approved') {
        setError('Your brand account must be approved to view campaigns.')
        return
      }

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select(
          'id, campaign_name, campaign_status, base_amount, gst_amount, commission_amount, total_amount, created_at'
        )
        .eq('brand_id', userId)
        .order('created_at', { ascending: false })

      if (campaignError) {
        throw new Error(`Could not load campaigns: ${campaignError.message}`)
      }

      const campaignList = (campaignData ?? []) as Campaign[]
      setCampaigns(campaignList)

      if (campaignList.length === 0) {
        setItems([])
        setPayments([])
        setPurchaseOrders([])
        setInvoices([])
        setPoLinks({})
        return
      }

      const campaignIds = campaignList.map((campaign) => campaign.id)

      const [
        itemsResult,
        paymentsResult,
        purchaseOrdersResult,
        invoicesResult,
      ] = await Promise.all([
        supabase
          .from('campaign_items')
          .select(
            'id, campaign_id, society_id, item_name, category, item_type, quantity, rate, rate_unit, campaign_start_date, campaign_end_date, base_amount, gst_amount, commission_amount, total_amount, admin_status, society_status, item_status'
          )
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false }),

        supabase
          .from('campaign_payments')
          .select(
            'id, campaign_id, payment_status, base_amount, gst_amount, total_amount, razorpay_order_id, razorpay_payment_id, paid_at'
          )
          .in('campaign_id', campaignIds),

        supabase
          .from('purchase_orders')
          .select(
            'id, campaign_id, po_type, po_status, po_number, po_date, document_url, admin_remarks, created_at'
          )
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false }),

        supabase
          .from('campaign_invoices')
          .select(
            'id, campaign_id, invoice_type, invoice_number, base_amount, gst_rate, gst_amount, total_amount, invoice_date, invoice_status'
          )
          .in('campaign_id', campaignIds)
          .eq('invoice_type', 'brand_invoice')
          .eq('brand_id', userId)
          .order('created_at', { ascending: false }),
      ])

      if (itemsResult.error) {
        throw new Error(
          `Could not load campaign items: ${itemsResult.error.message}`
        )
      }

      if (paymentsResult.error) {
        throw new Error(
          `Could not load campaign payments: ${paymentsResult.error.message}`
        )
      }

      if (purchaseOrdersResult.error) {
        throw new Error(
          `Could not load purchase orders: ${purchaseOrdersResult.error.message}`
        )
      }

      if (invoicesResult.error) {
        throw new Error(
          `Could not load invoices: ${invoicesResult.error.message}`
        )
      }

      const itemList = (itemsResult.data ?? []) as CampaignItem[]
      const paymentList = (paymentsResult.data ?? []) as CampaignPayment[]
      const poList = (purchaseOrdersResult.data ?? []) as PurchaseOrder[]
      const invoiceList = (invoicesResult.data ?? []) as CampaignInvoice[]

      setItems(itemList)
      setPayments(paymentList)
      setPurchaseOrders(poList)
      setInvoices(invoiceList)

      // Purchase-order documents are stored in a private bucket.
      const links: Record<string, string> = {}

      for (const po of poList) {
        if (!po.document_url) continue

        const { data: signedData } = await supabase.storage
          .from('campaign-purchase-orders')
          .createSignedUrl(po.document_url, 3600)

        if (signedData?.signedUrl) {
          links[po.id] = signedData.signedUrl
        }
      }

      setPoLinks(links)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load your campaigns.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const visibleCampaignItems = items.filter(item =>
    campaignView === 'approved'
      ? ['approved', 'confirmed'].includes(item.item_status)
      : item.item_status === campaignView
  )
  const pendingItemCount = items.filter(item => item.item_status === 'pending').length
  const approvedItemCount = items.filter(item => ['approved', 'confirmed'].includes(item.item_status)).length
  const rejectedItemCount = items.filter(item => item.item_status === 'rejected').length

  useEffect(() => {
    void loadCampaigns()
  }, [])

  function getCampaignItems(campaignId: string) {
    return items.filter((item) => item.campaign_id === campaignId)
  }

  function getCampaignPayment(campaignId: string) {
    return payments.find((payment) => payment.campaign_id === campaignId)
  }

  function getCampaignPOs(campaignId: string) {
    return purchaseOrders.filter((po) => po.campaign_id === campaignId)
  }

  function getCampaignInvoices(campaignId: string) {
    return invoices.filter((invoice) => invoice.campaign_id === campaignId)
  }

  function handlePrintInvoice(
    invoice: CampaignInvoice,
    campaign: Campaign
  ) {
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      setError('Please allow pop-ups in your browser to print the invoice.')
      return
    }

    const invoiceDate = invoice.invoice_date
      ? new Date(invoice.invoice_date).toLocaleDateString('en-IN')
      : 'Not available'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(invoice.invoice_number)}</title>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #1f2937;
              padding: 40px;
              max-width: 850px;
              margin: auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 20px;
            }
            h1 { color: #3730a3; margin: 0 0 8px; }
            h2 { margin-top: 32px; }
            .muted { color: #64748b; }
            .details {
              margin-top: 28px;
              line-height: 1.9;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 24px;
            }
            th, td {
              border: 1px solid #dbe2ea;
              padding: 13px;
              text-align: left;
            }
            th { background: #f1f5f9; }
            .amount { text-align: right; }
            .total {
              font-size: 20px;
              font-weight: bold;
              color: #3730a3;
            }
            .footer {
              margin-top: 55px;
              border-top: 1px solid #dbe2ea;
              padding-top: 15px;
              font-size: 12px;
              color: #64748b;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>AdSociety</h1>
              <div class="muted">Campaign Tax Invoice</div>
            </div>
            <div>
              <strong>Invoice Number</strong><br />
              ${escapeHtml(invoice.invoice_number)}<br /><br />
              <strong>Invoice Date</strong><br />
              ${escapeHtml(invoiceDate)}
            </div>
          </div>

          <div class="details">
            <strong>Campaign:</strong> ${escapeHtml(campaign.campaign_name)}<br />
            <strong>Campaign Reference:</strong> ${escapeHtml(campaign.id)}<br />
            <strong>Invoice Status:</strong> ${escapeHtml(formatStatus(invoice.invoice_status))}
          </div>

          <h2>Invoice Summary</h2>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Taxable campaign amount</td>
                <td class="amount">₹${escapeHtml(money(invoice.base_amount))}</td>
              </tr>
              <tr>
                <td>GST (${escapeHtml(invoice.gst_rate)}%)</td>
                <td class="amount">₹${escapeHtml(money(invoice.gst_amount))}</td>
              </tr>
              <tr>
                <td class="total">Total Invoice Amount</td>
                <td class="amount total">₹${escapeHtml(money(invoice.total_amount))}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            This invoice was generated electronically by AdSociety.
            Please retain this document for your records.
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()

    window.setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  function allItemsReviewed(campaignItems: CampaignItem[]) {
    return (
      campaignItems.length > 0 &&
      campaignItems.every((item) => item.item_status !== 'pending')
    )
  }

  function hasApprovedItems(campaignItems: CampaignItem[]) {
    return campaignItems.some((item) => item.item_status === 'approved')
  }

  function hasActivePO(campaignPOs: PurchaseOrder[]) {
    return campaignPOs.some((po) =>
      ['requested', 'uploaded', 'under_review', 'generated'].includes(
        po.po_status
      )
    )
  }

  async function handleSelectPOOption(
    campaign: Campaign,
    poType: 'adsociety_generated' | 'brand_uploaded' | 'direct_payment'
  ) {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setError('')
    setNotice('')
    setPoActionId(campaign.id)

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'brand_select_campaign_po_option',
        {
          p_campaign_id: campaign.id,
          p_po_type: poType,
        }
      )

      if (rpcError) throw new Error(rpcError.message)
      if (data?.success === false) {
        throw new Error(data.error || 'Could not select this PO option.')
      }

      if (poType === 'direct_payment') {
        setNotice('Direct payment selected. You can now proceed to payment.')
      } else if (poType === 'adsociety_generated') {
        setNotice(
          'Your request for an AdSociety-generated PO has been submitted.'
        )
      } else {
        setNotice(
          'Brand PO upload selected. Please upload your purchase order below.'
        )
      }

      await loadCampaigns(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to select the PO option.'
      )
    } finally {
      setPoActionId(null)
    }
  }

  async function handleUploadPO(campaign: Campaign, po: PurchaseOrder) {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    const file = poFiles[campaign.id]
    const poNumber = (poNumbers[campaign.id] || '').trim()
    const poDate = poDates[campaign.id]

    if (!file) {
      setError('Please select your purchase-order document.')
      return
    }

    if (!poNumber || !poDate) {
      setError('Please enter your PO number and PO date.')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG and PNG files are allowed.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('The PO document must be 10 MB or smaller.')
      return
    }

    setError('')
    setNotice('')
    setUploadingId(campaign.id)

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Please log in again.')
      }

      const safeFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')

      const documentPath =
        `${userData.user.id}/${campaign.id}/${Date.now()}_${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from('campaign-purchase-orders')
        .upload(documentPath, file, {
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) {
        throw new Error(`PO upload failed: ${uploadError.message}`)
      }

      const { data, error: submitError } = await supabase.rpc(
        'brand_submit_uploaded_po',
        {
          p_po_id: po.id,
          p_document_path: documentPath,
          p_po_number: poNumber,
          p_po_date: poDate,
        }
      )

      if (submitError) {
        throw new Error(submitError.message)
      }

      if (data?.success === false) {
        throw new Error(data.error || 'Could not submit the PO.')
      }

      setPoFiles((previous) => ({ ...previous, [campaign.id]: null }))
      setNotice(
        'Your purchase order has been uploaded and submitted for Admin review.'
      )

      await loadCampaigns(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to upload the purchase order.'
      )
    } finally {
      setUploadingId(null)
    }
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
        existing.addEventListener('load', () => resolve(true), {
          once: true,
        })
        existing.addEventListener('error', () => resolve(false), {
          once: true,
        })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })

  async function handlePay(campaign: Campaign) {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setError('')
    setNotice('')

    const campaignItems = getCampaignItems(campaign.id)

    const eligibleForPayment =
      campaign.campaign_status === 'awaiting_payment' &&
      allItemsReviewed(campaignItems) &&
      hasApprovedItems(campaignItems)

    if (!eligibleForPayment) {
      setError(
        'Payment is available only after all campaign items have been reviewed and at least one item is approved.'
      )
      return
    }

    setPayingId(campaign.id)

    try {
      const { data: orderData, error: orderError } =
        await supabase.functions.invoke(
          'create-campaign-razorpay-order',
          {
            body: { campaign_id: campaign.id },
          }
        )

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

        throw new Error(
          detail || 'Could not create the campaign payment order.'
        )
      }

      if (!orderData?.order_id || !orderData?.key_id) {
        throw new Error(
          orderData?.error || 'Razorpay did not return a valid campaign order.'
        )
      }

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
        description: campaign.campaign_name,
        order_id: orderData.order_id,
        prefill: {},
        notes: { campaign_id: campaign.id },
        theme: { color: '#4f46e5' },

        modal: {
          ondismiss: () => {
            setPayingId(null)
            setNotice(
              'Payment window closed. If payment was not completed, refresh the campaign and try again.'
            )
            void loadCampaigns(true)
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
                'verify-campaign-razorpay-payment',
                {
                  body: {
                    campaign_id: campaign.id,
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

              throw new Error(
                detail || 'Campaign payment verification failed.'
              )
            }

            if (verifyData?.error || verifyData?.success === false) {
              throw new Error(
                verifyData.error || 'Campaign payment verification failed.'
              )
            }

            setNotice(
              'Campaign payment verified successfully. Your campaign is now confirmed.'
            )

            await loadCampaigns(true)
          } catch (err) {
            setError(
              err instanceof Error
                ? `Payment verification needs attention: ${err.message}`
                : 'Payment verification needs attention. Refresh and check your campaign status before trying again.'
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
              'Payment failed. Refresh your campaign status before attempting another payment.'
          )
        }
      )

      checkout.open()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to start campaign payment.'
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
        <h1>My Campaigns</h1>
        <p>
          Track item-wise approvals, manage purchase orders, view invoices
          and pay securely for your approved campaign items.
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
            onClick={() => void loadCampaigns(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh campaigns'}
          </button>

          <Link to="/brand-marketplace" className="button button-ghost">
            Browse marketplace
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '0 0 22px' }}>
          {([
            ['pending', pendingItemCount],
            ['approved', approvedItemCount],
            ['rejected', rejectedItemCount],
          ] as const).map(([status, count]) => (
            <button
              key={status}
              type="button"
              className={campaignView === status ? 'button' : 'button button-ghost'}
              onClick={() => setCampaignView(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          ))}
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
            <p>Loading your campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="login-panel">
            <h2>No campaigns yet</h2>
            <p>Your submitted campaigns will appear here.</p>
            <Link to="/brand-marketplace" className="text-link">
              Find advertising spaces <ArrowLeft size={15} />
            </Link>
          </div>
        ) : (
          <div className="format-grid">
            {campaigns.map((campaign) => {
              const campaignItems = getCampaignItems(campaign.id)
              const payment = getCampaignPayment(campaign.id)
              const campaignPOs = getCampaignPOs(campaign.id)
              const campaignInvoices = getCampaignInvoices(campaign.id)

              const approvedItems = campaignItems.filter(
                (item) => item.item_status === 'approved'
              )

              const rejectedItems = campaignItems.filter(
                (item) => item.item_status === 'rejected'
              )

              const pendingItems = campaignItems.filter(
                (item) => item.item_status === 'pending'
              )

              const reviewed = allItemsReviewed(campaignItems)
              const hasApproved = hasApprovedItems(campaignItems)
              const activePO = hasActivePO(campaignPOs)

              const canChoosePO =
                ['approved', 'partially_approved'].includes(
                  campaign.campaign_status
                ) &&
                reviewed &&
                hasApproved &&
                !activePO &&
                !payment?.payment_status?.includes('paid')

              const canPay =
                campaign.campaign_status === 'awaiting_payment' &&
                reviewed &&
                hasApproved &&
                payment?.payment_status !== 'paid'

              const paid =
                payment?.payment_status === 'paid' ||
                campaign.campaign_status === 'confirmed'

              const brandUploadPO = campaignPOs.find(
                (po) => po.po_type === 'brand_uploaded'
              )

              return (
                <article className="format-card" key={campaign.id}>
                  <div className="format-icon">
                    <Building2 />
                  </div>

                  <h3>{campaign.campaign_name}</h3>

                  <p>Campaign reference: {campaign.id}</p>

                  <p>
                    Created:{' '}
                    {new Date(campaign.created_at).toLocaleDateString('en-IN')}
                  </p>

                  <p>
                    Campaign status:{' '}
                    <strong
                      style={{
                        color: statusColor(campaign.campaign_status),
                      }}
                    >
                      {formatStatus(campaign.campaign_status)}
                    </strong>
                  </p>

                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      borderRadius: 10,
                      background: 'rgba(100, 116, 139, 0.08)',
                    }}
                  >
                    <h4 style={{ marginTop: 0 }}>
                      Campaign item approvals
                    </h4>

                    <p>
                      <strong style={{ color: '#15803d' }}>
                        Approved: {approvedItems.length}
                      </strong>
                      {' · '}
                      <strong style={{ color: '#b91c1c' }}>
                        Rejected: {rejectedItems.length}
                      </strong>
                      {' · '}
                      <strong style={{ color: '#a16207' }}>
                        Pending: {pendingItems.length}
                      </strong>
                    </p>

                    {campaignItems.length === 0 ? (
                      <p>No campaign items found.</p>
                    ) : visibleCampaignItems.filter(item => item.campaign_id === campaign.id).length === 0 ? (
                      <p>No {campaignView} items in this campaign.</p>
                    ) : (
                      visibleCampaignItems.filter(item => item.campaign_id === campaign.id).map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: '12px 0',
                            borderTop: '1px solid rgba(100, 116, 139, 0.2)',
                          }}
                        >
                          <strong>{item.item_name}</strong>
                          <p style={{ margin: '5px 0' }}>
                            {item.category || formatStatus(item.item_type)}
                            {' · '}Quantity: {item.quantity}
                          </p>

                          <p style={{ margin: '5px 0' }}>
                            Start: {item.campaign_start_date || 'Not specified'}
                            {' · '}
                            End: {item.campaign_end_date || 'Not specified'}
                          </p>

                          <p style={{ margin: '5px 0' }}>
                            Admin:{' '}
                            <strong
                              style={{
                                color: statusColor(item.admin_status),
                              }}
                            >
                              {formatStatus(item.admin_status)}
                            </strong>
                            {' · '}
                            Society:{' '}
                            <strong
                              style={{
                                color: statusColor(item.society_status),
                              }}
                            >
                              {formatStatus(item.society_status)}
                            </strong>
                          </p>

                          <p style={{ margin: '5px 0' }}>
                            Item status:{' '}
                            <strong
                              style={{
                                color: statusColor(item.item_status),
                              }}
                            >
                              {formatStatus(item.item_status)}
                            </strong>
                          </p>

                          <p style={{ margin: '5px 0' }}>
                            Item amount: ₹{money(item.total_amount)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      borderRadius: 10,
                      background: 'rgba(100, 116, 139, 0.08)',
                    }}
                  >
                    <h4 style={{ marginTop: 0 }}>Payment summary</h4>

                    <p>
                      Base amount: ₹
                      {money(payment?.base_amount ?? campaign.base_amount)}
                    </p>

                    <p>
                      GST: ₹
                      {money(payment?.gst_amount ?? campaign.gst_amount)}
                    </p>

                    <p>
                      <strong>
                        Total payable: ₹
                        {money(payment?.total_amount ?? campaign.total_amount)}
                      </strong>
                    </p>

                    {payment && (
                      <p>
                        Payment status:{' '}
                        <strong
                          style={{
                            color: statusColor(payment.payment_status),
                          }}
                        >
                          {formatStatus(payment.payment_status)}
                        </strong>
                      </p>
                    )}

                    {paid && (
                      <p style={{ color: '#15803d', fontWeight: 700 }}>
                        <ShieldCheck size={17} /> Campaign payment confirmed
                      </p>
                    )}
                  </div>

                  {/* BRAND INVOICES */}
                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      borderRadius: 10,
                      background: 'rgba(79, 70, 229, 0.06)',
                      border: '1px solid rgba(79, 70, 229, 0.16)',
                    }}
                  >
                    <h4 style={{ marginTop: 0 }}>
                      <FileText
                        size={17}
                        style={{
                          display: 'inline',
                          verticalAlign: 'middle',
                          marginRight: 6,
                        }}
                      />
                      Campaign invoices
                    </h4>

                    {campaignInvoices.length === 0 ? (
                      <p style={{ marginBottom: 0 }}>
                        No invoice has been generated for this campaign yet.
                        The invoice will appear here after successful payment
                        confirmation and invoice generation.
                      </p>
                    ) : (
                      campaignInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          style={{
                            padding: '12px 0',
                            borderTop: '1px solid rgba(100, 116, 139, 0.2)',
                          }}
                        >
                          <p>
                            <strong>Invoice number:</strong>{' '}
                            {invoice.invoice_number}
                          </p>

                          <p>
                            <strong>Invoice date:</strong>{' '}
                            {invoice.invoice_date
                              ? new Date(
                                  invoice.invoice_date
                                ).toLocaleDateString('en-IN')
                              : 'Not available'}
                          </p>

                          <p>
                            <strong>Taxable amount:</strong> ₹
                            {money(invoice.base_amount)}
                          </p>

                          <p>
                            <strong>GST ({money(invoice.gst_rate)}%):</strong>{' '}
                            ₹{money(invoice.gst_amount)}
                          </p>

                          <p>
                            <strong>Total invoice amount:</strong>{' '}
                            <span style={{ fontWeight: 700 }}>
                              ₹{money(invoice.total_amount)}
                            </span>
                          </p>

                          <p>
                            <strong>Invoice status:</strong>{' '}
                            <span
                              style={{
                                color: statusColor(invoice.invoice_status),
                                fontWeight: 700,
                              }}
                            >
                              {formatStatus(invoice.invoice_status)}
                            </span>
                          </p>

                          <button
                            className="button form-submit"
                            type="button"
                            onClick={() =>
                              handlePrintInvoice(invoice, campaign)
                            }
                          >
                            <Download size={16} />
                            Print / Save as PDF
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {campaignPOs.length > 0 && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 14,
                        borderRadius: 10,
                        background: 'rgba(100, 116, 139, 0.08)',
                      }}
                    >
                      <h4 style={{ marginTop: 0 }}>
                        Purchase order
                      </h4>

                      {campaignPOs.map((po) => (
                        <div
                          key={po.id}
                          style={{
                            padding: '10px 0',
                            borderTop: '1px solid rgba(100, 116, 139, 0.2)',
                          }}
                        >
                          <p>
                            <strong>{poTypeLabel(po.po_type)}</strong>
                          </p>

                          <p>
                            Status:{' '}
                            <strong
                              style={{ color: statusColor(po.po_status) }}
                            >
                              {formatStatus(po.po_status)}
                            </strong>
                          </p>

                          {po.po_number && <p>PO number: {po.po_number}</p>}
                          {po.po_date && <p>PO date: {po.po_date}</p>}
                          {po.admin_remarks && (
                            <p>Admin remarks: {po.admin_remarks}</p>
                          )}

                          {poLinks[po.id] && (
                            <p>
                              <a
                                href={poLinks[po.id]}
                                target="_blank"
                                rel="noreferrer"
                                className="text-link"
                              >
                                <FileText size={15} /> View purchase order
                              </a>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {canChoosePO && (
                    <div style={{ marginTop: 18 }}>
                      <h4>Choose your payment / PO option</h4>
                      <p>
                        All items have been reviewed. You can proceed with
                        approved items only.
                      </p>

                      <button
                        className="button form-submit"
                        disabled={poActionId !== null}
                        onClick={() =>
                          void handleSelectPOOption(
                            campaign,
                            'adsociety_generated'
                          )
                        }
                      >
                        <FileText size={16} />
                        {poActionId === campaign.id
                          ? 'Submitting...'
                          : 'Request AdSociety-generated PO'}
                      </button>

                      <button
                        className="button button-ghost form-submit"
                        disabled={poActionId !== null}
                        onClick={() =>
                          void handleSelectPOOption(
                            campaign,
                            'brand_uploaded'
                          )
                        }
                        style={{ marginTop: 10 }}
                      >
                        <Upload size={16} />
                        Upload my own PO
                      </button>

                      <button
                        className="button button-ghost form-submit"
                        disabled={poActionId !== null}
                        onClick={() =>
                          void handleSelectPOOption(
                            campaign,
                            'direct_payment'
                          )
                        }
                        style={{ marginTop: 10 }}
                      >
                        <Wallet size={16} />
                        Proceed directly to payment
                      </button>
                    </div>
                  )}

                  {brandUploadPO &&
                    brandUploadPO.po_status === 'requested' && (
                      <div
                        style={{
                          marginTop: 18,
                          padding: 14,
                          borderRadius: 10,
                          background: 'rgba(100, 116, 139, 0.08)',
                        }}
                      >
                        <h4>Upload your purchase order</h4>

                        <label
                          htmlFor={`po-number-${campaign.id}`}
                          style={{ display: 'block', marginBottom: 6 }}
                        >
                          PO number
                        </label>

                        <input
                          id={`po-number-${campaign.id}`}
                          className="form-input"
                          value={poNumbers[campaign.id] || ''}
                          onChange={(event) =>
                            setPoNumbers((previous) => ({
                              ...previous,
                              [campaign.id]: event.target.value,
                            }))
                          }
                          placeholder="Enter PO number"
                        />

                        <label
                          htmlFor={`po-date-${campaign.id}`}
                          style={{
                            display: 'block',
                            marginTop: 12,
                            marginBottom: 6,
                          }}
                        >
                          PO date
                        </label>

                        <input
                          id={`po-date-${campaign.id}`}
                          className="form-input"
                          type="date"
                          value={poDates[campaign.id] || ''}
                          onChange={(event) =>
                            setPoDates((previous) => ({
                              ...previous,
                              [campaign.id]: event.target.value,
                            }))
                          }
                        />

                        <label
                          htmlFor={`po-file-${campaign.id}`}
                          style={{
                            display: 'block',
                            marginTop: 12,
                            marginBottom: 6,
                          }}
                        >
                          PO document (PDF, JPG or PNG; max 10 MB)
                        </label>

                        <input
                          id={`po-file-${campaign.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(event) =>
                            setPoFiles((previous) => ({
                              ...previous,
                              [campaign.id]:
                                event.target.files?.[0] || null,
                            }))
                          }
                        />

                        <button
                          className="button form-submit"
                          disabled={uploadingId !== null}
                          onClick={() =>
                            void handleUploadPO(campaign, brandUploadPO)
                          }
                          style={{ marginTop: 14 }}
                        >
                          <Upload size={16} />
                          {uploadingId === campaign.id
                            ? 'Uploading PO...'
                            : 'Submit PO for Admin review'}
                        </button>
                      </div>
                    )}

                  {canPay && !paid && (
                    <button
                      className="button form-submit"
                      disabled={payingId !== null}
                      onClick={() => void handlePay(campaign)}
                      style={{ marginTop: 18 }}
                    >
                      <Wallet size={16} />
                      {payingId === campaign.id
                        ? 'Opening payment...'
                        : 'Pay Now with Razorpay'}
                    </button>
                  )}

                  {!reviewed && campaignItems.length > 0 && (
                    <p style={{ marginTop: 14 }}>
                      Payment and PO options will become available after all
                      campaign items have been reviewed.
                    </p>
                  )}

                  {reviewed && !hasApproved && campaignItems.length > 0 && (
                    <p style={{ marginTop: 14, color: '#b91c1c' }}>
                      No campaign items were approved. Payment is not available.
                    </p>
                  )}

                  {campaign.campaign_status === 'awaiting_po' && (
                    <p style={{ marginTop: 14 }}>
                      Your purchase-order request is awaiting the next action.
                    </p>
                  )}

                  {campaign.campaign_status === 'confirmed' && !paid && (
                    <p style={{ marginTop: 14 }}>
                      This campaign is marked as confirmed. Refresh to update
                      the payment details.
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
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void
      on: (
        event: string,
        callback: (response: any) => void
      ) => void
    }
  }
}
