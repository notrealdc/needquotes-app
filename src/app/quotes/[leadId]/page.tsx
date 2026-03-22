'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function QuotesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const leadId = params.leadId as string
  const code = searchParams.get('code') || ''

  const [lead, setLead] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBid, setSelectedBid] = useState<any>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!leadId) return
    loadData()
  }, [leadId])

  async function loadData() {
    setLoading(true)
    const [leadRes, bidsRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('bids').select('*, contractors(*)').eq('lead_id', leadId).eq('status', 'submitted'),
    ])

    if (leadRes.data) setLead(leadRes.data)
    if (bidsRes.data) setBids(bidsRes.data)
    setLoading(false)
  }

  async function confirmBooking(bid: any) {
    setConfirming(true)
    try {
      await supabase.from('bids').update({ confirmed: true, status: 'won' }).eq('id', bid.id)
      await supabase.from('leads').update({ status: 'closed_won', assigned_contractor_id: bid.contractor_id }).eq('id', leadId)
      await supabase.from('bids').update({ status: 'lost' }).eq('lead_id', leadId).neq('id', bid.id)
      setSelectedBid(bid)
      setConfirmed(true)
    } catch (err) {
      console.error(err)
      alert('Something went wrong.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1628', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      Loading your quotes...
    </div>
  )

  if (!lead) return (
    <div style={{ minHeight: '100vh', background: '#0B1628', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      This link is invalid or expired.
    </div>
  )

  if (confirmed && selectedBid) {
    return (
      <main style={{ minHeight: '100vh', background: '#0B1628', color: 'white', fontFamily: 'sans-serif', padding: '40px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>You're All Set!</h1>
          <p style={{ color: '#94A3B8', fontSize: 18, marginBottom: 32 }}>
            You've selected <strong>{selectedBid.contractors?.name}</strong> from <strong>{selectedBid.contractors?.company}</strong>. 
            They will contact you shortly to confirm the job details.
          </p>
          <div style={{ background: '#132038', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, textAlign: 'left' }}>
            <h3 style={{ marginTop: 0 }}>Booking Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Company</div><div style={{ fontWeight: 600 }}>{selectedBid.contractors?.company}</div></div>
              <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Contact</div><div style={{ fontWeight: 600 }}>{selectedBid.contractors?.name}</div></div>
              <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Your Estimate</div><div style={{ fontWeight: 600, color: '#10B981' }}>${(selectedBid.estimate_cents / 100).toLocaleString()}</div></div>
              <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Time to Complete</div><div style={{ fontWeight: 600 }}>{selectedBid.time_to_complete_days} days</div></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0B1628', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#3B82F6', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Your Personalized Quotes</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{lead.name}, Here Are Your Quotes</h1>
          <p style={{ color: '#94A3B8' }}>{bids.length} contractor{bids.length !== 1 ? 's' : ''} submitted quotes for your {lead.problem_type} project</p>
        </div>

        {bids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#132038', borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h3 style={{ marginBottom: 8 }}>Quotes Are Still Coming In</h3>
            <p style={{ color: '#94A3B8' }}>Check back soon — contractors are still submitting their quotes. You'll get an email when they're ready.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bids
              .sort((a, b) => a.estimate_cents - b.estimate_cents)
              .map((bid, i) => {
                const c = bid.contractors
                const isSelected = selectedBid?.id === bid.id
                return (
                  <div key={bid.id} style={{ background: '#132038', border: `1px solid ${isSelected ? '#3B82F6' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 28, position: 'relative' }}>
                    {i === 0 && <div style={{ position: 'absolute', top: -12, left: 20, background: '#10B981', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, letterSpacing: 1 }}>LOWEST ESTIMATE</div>}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h3 style={{ margin: 0, marginBottom: 4, fontSize: 18 }}>{c?.company || 'Contractor'}</h3>
                        <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>{c?.name} · {c?.specialty}</p>
                        <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: 13 }}>{c?.service_area}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>${(bid.estimate_cents / 100).toLocaleString()}</div>
                        <div style={{ color: '#94A3B8', fontSize: 13 }}>Est. {(bid.estimate_cents / 100).toLocaleString()} total</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '20px 0', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>Time to Complete</div>
                        <div style={{ fontWeight: 600 }}>{bid.time_to_complete_days} days</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>Earliest Available</div>
                        <div style={{ fontWeight: 600 }}>{bid.earliest_available ? new Date(bid.earliest_available).toLocaleDateString() : 'TBD'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>Service Area</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c?.service_area}</div>
                      </div>
                    </div>

                    {bid.notes && <p style={{ color: '#94A3B8', fontSize: 14, margin: '0 0 20px', fontStyle: 'italic' }}>"{bid.notes}"</p>}

                    <button
                      onClick={() => confirmBooking(bid)}
                      disabled={confirming}
                      style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.6 : 1 }}
                    >
                      {confirming ? 'Confirming...' : `✅ Select ${c?.company} — $${(bid.estimate_cents / 100).toLocaleString()}`}
                    </button>
                  </div>
                )
              })}
          </div>
        )}

        <div style={{ marginTop: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          <p>Quotes will be available for 7 days. Your chosen contractor will receive your contact info to schedule the job.</p>
        </div>
      </div>
    </main>
  )
}
