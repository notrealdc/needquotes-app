'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  trade: string
  problem_type: string
  zip_code: string
  timeline: string
  budget_range: string | null
  description: string | null
  status: string
  scoring: number | null
  created_at: string
  photo_urls: string[] | null
}

type Contractor = {
  id: string
  name: string
  email: string
  specialty: string
  phone: string
  status: string
  created_at: string
}

type Bid = {
  id: string
  lead_id: string
  contractor_id: string
  estimate_cents: number | null
  time_to_complete_days: number | null
  earliest_available: string | null
  status: string
  confirmed: boolean | null
  created_at: string
}

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [activeTab, setActiveTab] = useState<'leads' | 'contractors' | 'bids'>('leads')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [leadsRes, contractorsRes, bidsRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('contractors').select('*').order('created_at', { ascending: false }),
      supabase.from('bids').select('*').order('created_at', { ascending: false }),
    ])
    if (leadsRes.data) setLeads(leadsRes.data)
    if (contractorsRes.data) setContractors(contractorsRes.data)
    if (bidsRes.data) setBids(bidsRes.data)
    setLoading(false)
  }

  async function updateLeadStatus(id: string, status: string) {
    await supabase.from('leads').update({ status }).eq('id', id)
    fetchAll()
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    fetchAll()
  }

  async function deleteContractor(id: string) {
    if (!confirm('Delete this contractor?')) return
    await supabase.from('contractors').delete().eq('id', id)
    fetchAll()
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3B82F6'
      case 'contractors_notified': return '#F59E0B'
      case 'quoted': return '#8B5CF6'
      case 'closed_won': return '#10B981'
      case 'closed_lost': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const formatCents = (cents: number | null) => {
    if (!cents) return '—'
    return '$' + (cents / 100).toLocaleString()
  }

  const pipelineStats = {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    quoted: leads.filter(l => l.status === 'quoted').length,
    closedWon: leads.filter(l => l.status === 'closed_won').length,
    totalContractors: contractors.length,
    pendingContractors: contractors.filter(c => c.status === 'pending').length,
    totalBids: bids.length,
    confirmedBids: bids.filter(b => b.confirmed).length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((s, l) => s + (l.scoring || 0), 0) / leads.length) : 0,
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#0f1117', minHeight: '100vh', color: '#f9fafb', padding: '0' }}>
      {/* Header */}
      <div style={{ background: '#1a1d27', borderBottom: '1px solid #2d3140', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#fff' }}>⚡ NeedQuotes Admin</h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '13px' }}>Pipeline Overview</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>← Back to Site</a>
          <button onClick={fetchAll} style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>↻ Refresh</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', padding: '24px 32px', background: '#13151f' }}>
        {[
          { label: 'Total Leads', value: pipelineStats.totalLeads, color: '#3B82F6' },
          { label: 'New', value: pipelineStats.newLeads, color: '#60A5FA' },
          { label: 'Quoted', value: pipelineStats.quoted, color: '#8B5CF6' },
          { label: 'Closed Won', value: pipelineStats.closedWon, color: '#10B981' },
          { label: 'Contractors', value: pipelineStats.totalContractors, color: '#F59E0B' },
          { label: 'Total Bids', value: pipelineStats.totalBids, color: '#EC4899' },
          { label: 'Confirmed', value: pipelineStats.confirmedBids, color: '#10B981' },
          { label: 'Avg Score', value: pipelineStats.avgScore, color: '#6B7280' },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#1a1d27', borderRadius: '10px', padding: '14px 16px', border: '1px solid #2d3140' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', padding: '0 32px', background: '#13151f', borderBottom: '1px solid #2d3140' }}>
        {(['leads', 'contractors', 'bids'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : '#6B7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : activeTab === 'leads' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d3140', textAlign: 'left', color: '#6B7280' }}>
                  <th style={{ padding: '8px 12px' }}>Name</th>
                  <th style={{ padding: '8px 12px' }}>Contact</th>
                  <th style={{ padding: '8px 12px' }}>Trade / Problem</th>
                  <th style={{ padding: '8px 12px' }}>ZIP</th>
                  <th style={{ padding: '8px 12px' }}>Timeline</th>
                  <th style={{ padding: '8px 12px' }}>Budget</th>
                  <th style={{ padding: '8px 12px' }}>Score</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                  <th style={{ padding: '8px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #1f2130' }}>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>{lead.name}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>
                      <div>{lead.phone}</div>
                      <div style={{ color: '#6B7280', fontSize: '12px' }}>{lead.email || '—'}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: '#3B82F6', fontWeight: 600 }}>{lead.trade}</span>
                      <div style={{ color: '#9CA3AF', fontSize: '12px' }}>{lead.problem_type}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{lead.zip_code}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{lead.timeline}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{lead.budget_range || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: lead.scoring && lead.scoring > 5 ? '#10B981' : lead.scoring && lead.scoring > 3 ? '#F59E0B' : '#EF4444',
                        color: '#fff',
                        textAlign: 'center',
                        lineHeight: '32px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}>{lead.scoring ?? '—'}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <select
                        value={lead.status}
                        onChange={e => updateLeadStatus(lead.id, e.target.value)}
                        style={{
                          background: statusColor(lead.status) + '22',
                          color: statusColor(lead.status),
                          border: '1px solid ' + statusColor(lead.status) + '44',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="contractors_notified">Notified</option>
                        <option value="quoted">Quoted</option>
                        <option value="closed_won">Won</option>
                        <option value="closed_lost">Lost</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: '12px' }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a href={`/quotes/${lead.id}?code=${lead.id.slice(0,8)}`} target="_blank" style={{ color: '#3B82F6', textDecoration: 'none', fontSize: '12px', background: '#3B82F622', padding: '4px 8px', borderRadius: '4px' }}>Quotes</a>
                        <button onClick={() => deleteLead(lead.id)} style={{ background: '#EF444422', color: '#EF4444', border: '1px solid #EF444444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No leads yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'contractors' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d3140', textAlign: 'left', color: '#6B7280' }}>
                  <th style={{ padding: '8px 12px' }}>Name</th>
                  <th style={{ padding: '8px 12px' }}>Email</th>
                  <th style={{ padding: '8px 12px' }}>Specialty</th>
                  <th style={{ padding: '8px 12px' }}>Phone</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                  <th style={{ padding: '8px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contractors.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1f2130' }}>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{c.email}</td>
                    <td style={{ padding: '10px 12px', color: '#F59E0B', fontWeight: 600 }}>{c.specialty}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{c.phone}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: c.status === 'pending' ? '#F59E0B22' : '#10B98122',
                        color: c.status === 'pending' ? '#F59E0B' : '#10B981',
                        border: '1px solid',
                        borderColor: c.status === 'pending' ? '#F59E0B44' : '#10B98144',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: '12px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => deleteContractor(c.id)} style={{ background: '#EF444422', color: '#EF4444', border: '1px solid #EF444444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Del</button>
                    </td>
                  </tr>
                ))}
                {contractors.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No contractors yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bids' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d3140', textAlign: 'left', color: '#6B7280' }}>
                  <th style={{ padding: '8px 12px' }}>Lead ID</th>
                  <th style={{ padding: '8px 12px' }}>Contractor ID</th>
                  <th style={{ padding: '8px 12px' }}>Estimate</th>
                  <th style={{ padding: '8px 12px' }}>Days</th>
                  <th style={{ padding: '8px 12px' }}>Available</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Confirmed</th>
                  <th style={{ padding: '8px 12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(bid => (
                  <tr key={bid.id} style={{ borderBottom: '1px solid #1f2130' }}>
                    <td style={{ padding: '10px 12px', color: '#3B82F6', fontFamily: 'monospace', fontSize: '11px' }}>{bid.lead_id.slice(0, 8)}...</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF', fontFamily: 'monospace', fontSize: '11px' }}>{bid.contractor_id.slice(0, 8)}...</td>
                    <td style={{ padding: '10px 12px', color: '#10B981', fontWeight: 700 }}>{formatCents(bid.estimate_cents)}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{bid.time_to_complete_days ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{bid.earliest_available || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{bid.status}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: bid.confirmed ? '#10B981' : '#6B7280', fontSize: '16px' }}>{bid.confirmed ? '✓' : '—'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: '12px' }}>{new Date(bid.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {bids.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No bids yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
