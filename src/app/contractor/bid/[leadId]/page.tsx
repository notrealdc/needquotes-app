'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ContractorBidPage() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('leadId') || ''
  const contractorId = searchParams.get('c') || ''

  const [lead, setLead] = useState<any>(null)
  const [contractor, setContractor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [estimate, setEstimate] = useState('')
  const [timeToComplete, setTimeToComplete] = useState('')
  const [earliestAvailable, setEarliestAvailable] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!leadId || !contractorId) return
    loadData()
  }, [leadId, contractorId])

  async function loadData() {
    setLoading(true)
    const [leadRes, contractorRes, bidRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('contractors').select('*').eq('id', contractorId).single(),
      supabase.from('bids').select('id').eq('lead_id', leadId).eq('contractor_id', contractorId).single(),
    ])

    if (leadRes.data) setLead(leadRes.data)
    if (contractorRes.data) setContractor(contractorRes.data)
    if (bidRes.data) setAlreadySubmitted(true)
    setLoading(false)
  }

  async function submitBid() {
    if (!estimate || !timeToComplete || !earliestAvailable) {
      alert('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('bids').insert({
        lead_id: leadId,
        contractor_id: contractorId,
        estimate_cents: Math.round(parseFloat(estimate.replace(/[^0-9.]/g, '')) * 100),
        time_to_complete_days: parseInt(timeToComplete),
        earliest_available: earliestAvailable,
        notes,
        status: 'submitted',
      })
      if (error) throw error
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Loading...</div>
  if (!lead || !contractor) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Lead not found.</div>
  if (submitted) return (
    <div style={{ padding: 60, textAlign: 'center', fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Quote Submitted!</h1>
      <p style={{ color: '#666' }}>The homeowner will be notified and can view your quote shortly. Good luck!</p>
    </div>
  )
  if (alreadySubmitted) return (
    <div style={{ padding: 60, textAlign: 'center', fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>⏳</div>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Already Submitted</h1>
      <p style={{ color: '#666' }}>You've already submitted a quote for this lead. The homeowner has been notified.</p>
    </div>
  )

  return (
    <main style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#0B1628', color: '#F8FAFC', padding: '40px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 14, color: '#3B82F6', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Contractor Bid Portal</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Submit Your Quote</h1>
          <p style={{ color: '#94A3B8' }}>Hi {contractor.name}, fill out the details below to bid on this lead.</p>
        </div>

        <div style={{ background: '#132038', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Lead Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Trade</div><div style={{ fontWeight: 600 }}>{lead.trade}</div></div>
            <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Problem</div><div style={{ fontWeight: 600 }}>{lead.problem_type}</div></div>
            <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Location</div><div style={{ fontWeight: 600 }}>ZIP {lead.zip_code}</div></div>
            <div><div style={{ fontSize: 12, color: '#94A3B8' }}>Timeline</div><div style={{ fontWeight: 600 }}>{lead.timeline}</div></div>
            <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: 12, color: '#94A3B8' }}>Description</div><div style={{ fontWeight: 600 }}>{lead.description || 'None provided'}</div></div>
          </div>
        </div>

        <div style={{ background: '#132038', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>Your Quote</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Estimate ($) *</label>
            <input
              type="text"
              placeholder="e.g. 2,500"
              value={estimate}
              onChange={e => setEstimate(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Time to Complete (days) *</label>
            <input
              type="number"
              placeholder="e.g. 3"
              value={timeToComplete}
              onChange={e => setTimeToComplete(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Earliest Available Date *</label>
            <input
              type="date"
              value={earliestAvailable}
              onChange={e => setEarliestAvailable(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Notes (optional)</label>
            <textarea
              placeholder="Any additional details for the homeowner..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 16px', color: 'white', fontSize: 16, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={submitBid}
            disabled={submitting}
            style={{ width: '100%', padding: 18, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Submitting...' : '🔥 Submit Quote →'}
          </button>
        </div>
      </div>
    </main>
  )
}
