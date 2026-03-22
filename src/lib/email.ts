// Email via Gmail via Maton gateway
// The MATON_API_KEY env var is used by the server-side Gmail integration

const MATON_API_KEY = process.env.MATON_API_KEY
const GATEWAY_BASE = 'https://gateway.maton.ai'

async function sendGmail(params: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  if (!MATON_API_KEY) {
    throw new Error('MATON_API_KEY not set')
  }

  const email_lines = [
    `To: ${params.to}`,
    `From: NeedQuotes <junkdc14@gmail.com>`,
    `Subject: ${params.subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    params.html,
  ]
  const encoded = Buffer.from(email_lines.join('\n')).toString('base64url')

  const res = await fetch(`${GATEWAY_BASE}/google-mail/gmail/v1/users/me/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MATON_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gmail send failed: ${err}`)
  }

  return res.json()
}

export async function sendLeadNotificationToContractors(params: {
  contractorEmail: string
  contractorName: string
  leadName: string
  leadPhone: string
  trade: string
  problemType: string
  zipCode: string
  timeline: string
  budget: string
  description?: string
  bidUrl: string
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">🚨 New Lead Alert — ${params.trade}</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
        <h3 style="margin-top: 0;">Lead Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #666;"><strong>Name:</strong></td><td>${params.leadName}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;"><strong>Phone:</strong></td><td>${params.leadPhone}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;"><strong>ZIP Code:</strong></td><td>${params.zipCode}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;"><strong>Problem:</strong></td><td>${params.problemType}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;"><strong>Timeline:</strong></td><td>${params.timeline}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;"><strong>Budget:</strong></td><td>${params.budget || 'Not specified'}</td></tr>
          ${params.description ? `<tr><td style="padding: 4px 0; color: #666;"><strong>Description:</strong></td><td>${params.description}</td></tr>` : ''}
        </table>
      </div>
      <a href="${params.bidUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 10px 0;">Submit Your Quote →</a>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">This is an <strong>exclusive lead</strong> — only you have this link. Submit your quote to be featured on the homeowner's quote comparison page.</p>
    </div>
  `

  return sendGmail({
    to: params.contractorEmail,
    subject: `New Lead: ${params.trade} - ${params.problemType} in ZIP ${params.zipCode}`,
    html,
  })
}

export async function sendQuotesReadyToHomeowner(params: {
  homeownerEmail: string
  homeownerName: string
  trade: string
  problemType: string
  timeline: string
  zipCode: string
  quotesUrl: string
  contractorCount: number
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">${params.contractorCount} Contractors Are Preparing Quotes! 🎉</h2>
      <p>Hi ${params.homeownerName}, we've notified <strong>${params.contractorCount} verified ${params.trade} contractors</strong> in your area about your ${params.problemType} project.</p>
      <p>You'll get an email as soon as quotes start coming in. Most homeowners receive all their quotes within <strong>10 minutes</strong>.</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Project</h3>
        <p style="margin: 4px 0;"><strong>Type:</strong> ${params.trade} — ${params.problemType}</p>
        <p style="margin: 4px 0;"><strong>Timeline:</strong> ${params.timeline}</p>
        <p style="margin: 4px 0;"><strong>ZIP:</strong> ${params.zipCode}</p>
      </div>
      <a href="${params.quotesUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View Quotes (Coming Soon) →</a>
    </div>
  `

  return sendGmail({
    to: params.homeownerEmail,
    subject: `${params.contractorCount} Contractors Are Preparing Your Quotes! ⏱️`,
    html,
  })
}
