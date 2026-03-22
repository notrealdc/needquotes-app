// HubSpot CRM via Maton Gateway

const MATON_API_KEY = process.env.MATON_API_KEY
const GATEWAY_BASE = 'https://gateway.maton.ai'
const HUBSPOT_CONNECTION_ID = 'bcbd0145-7992-4185-b6e1-1e4ac57bf83d' // Active HubSpot connection

async function hubspotRequest(path: string, method: string, body?: object) {
  const options: Record<string, unknown> = {
    hostname: GATEWAY_BASE,
    path: `/${path}`,
    method,
    headers: {
      Authorization: `Bearer ${MATON_API_KEY}`,
      'Maton-Connection': HUBSPOT_CONNECTION_ID,
      'Content-Type': 'application/json',
    },
  }

  return new Promise<{ status: number; data: unknown }>((resolve) => {
    const https = require('https')
    const req = https.request(options as Parameters<typeof https.request>[0], (res: { statusCode: number; on: (event: string, cb: (chunk: Buffer) => void) => void; }) => {
      let d = ''
      res.on('data', (c: Buffer) => (d += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) })
        } catch {
          resolve({ status: res.statusCode, data: d })
        }
      })
    })
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

export async function createHubSpotContact(lead: {
  name: string
  email?: string | null
  phone: string
  zip_code: string
  trade: string
  problem_type: string
  timeline: string
  budget_range?: string | null
  description?: string | null
}): Promise<{ contactId: string; dealId?: string } | null> {
  if (!MATON_API_KEY) {
    console.warn('MATON_API_KEY not set — skipping HubSpot')
    return null
  }

  const nameParts = lead.name.trim().split(' ')
  const firstName = nameParts[0] || 'Unknown'
  const lastName = nameParts.slice(1).join(' ') || 'Unknown'

  // Step 1: Create contact
  const contactRes = await hubspotRequest('hubspot/crm/v3/objects/contacts', 'POST', {
    properties: {
      firstname: firstName,
      lastname: lastName,
      email: lead.email || undefined,
      phone: lead.phone,
      zip: lead.zip_code,
      hs_lead_status: 'NEW',
      lifecyclestage: 'lead',
    },
  })

  if (contactRes.status !== 201) {
    console.error('HubSpot contact creation failed:', contactRes.data)
    return null
  }

  const contactId = (contactRes.data as { id: string }).id

  // Step 2: Create deal
  const budgetCents = lead.budget_range
    ? parseInt(lead.budget_range.replace(/[^0-9]/g, '')) * 100 || 0
    : 0

  const dealRes = await hubspotRequest('hubspot/crm/v3/objects/deals', 'POST', {
    properties: {
      dealname: `${lead.trade} — ${lead.problem_type} (${lead.zip_code})`,
      amount: String(budgetCents / 100 || 0),
      dealstage: 'appointmentscheduled',
      pipeline: 'default',
      description: `${lead.timeline} | ${lead.description || ''}`.trim(),
    },
  })

  let dealId: string | undefined
  if (dealRes.status === 201) {
    dealId = (dealRes.data as { id: string }).id

    // Step 3: Associate contact → deal
    await hubspotRequest(
      `hubspot/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
      'PUT',
      {}
    ).catch(() => {}) // Ignore association errors
  }

  console.log(`✅ HubSpot: contact ${contactId} + deal ${dealId} created for lead ${lead.name}`)
  return { contactId, dealId }
}
