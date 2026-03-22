import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://needquotes-app.vercel.app'

export async function sendLeadToContractors(lead: any, contractors: any[]) {
  for (const contractor of contractors) {
    const bidUrl = `${APP_URL}/contractor/bid/${lead.id}?c=${contractor.id}`

    await sgMail.send({
      to: contractor.email,
      from: 'NeedQuotes <noreply@needquotes.com>',
      subject: `New Lead: ${lead.trade} - ${lead.problem_type} in ZIP ${lead.zip_code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">🚨 New Lead Alert — ${lead.trade}</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0;">Lead Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #666;"><strong>Name:</strong></td><td>${lead.name}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Phone:</strong></td><td>${lead.phone}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Email:</strong></td><td>${lead.email || 'Not provided'}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>ZIP Code:</strong></td><td>${lead.zip_code}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Problem:</strong></td><td>${lead.problem_type}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Timeline:</strong></td><td>${lead.timeline}</td></tr>
              <tr><td style="padding: 4px 0; color: #666;"><strong>Budget:</strong></td><td>${lead.budget_range || 'Not specified'}</td></tr>
              ${lead.description ? `<tr><td style="padding: 4px 0; color: #666;"><strong>Description:</strong></td><td>${lead.description}</td></tr>` : ''}
            </table>
          </div>
          <a href="${bidUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 10px 0;">
            Submit Your Quote →
          </a>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">
            This is an <strong>exclusive lead</strong> — only you have this link. Submit your quote to be featured on the homeowner's quote comparison page.
          </p>
        </div>
      `,
    })
  }
}

export async function sendQuotesToHomeowner(lead: any, count: number) {
  const quotesUrl = `${APP_URL}/quotes/${lead.id}?code=${lead.id.slice(0, 8)}`
  await sgMail.send({
    to: lead.email,
    from: 'NeedQuotes <noreply@needquotes.com>',
    subject: `Your ${lead.trade} Quotes Are Ready! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">${count} Contractors Are Preparing Quotes! 🎉</h2>
        <p>We've notified <strong>${count} verified ${lead.trade} contractors</strong> in your area about your ${lead.problem_type} project.</p>
        <p>You'll get an email as soon as quotes start coming in. Most homeowners receive all their quotes within <strong>10 minutes</strong>.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Project</h3>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${lead.trade} — ${lead.problem_type}</p>
          <p style="margin: 4px 0;"><strong>Timeline:</strong> ${lead.timeline}</p>
          <p style="margin: 4px 0;"><strong>ZIP:</strong> ${lead.zip_code}</p>
        </div>
        <a href="${quotesUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          View Quotes (Coming Soon) →
        </a>
      </div>
    `,
  })
}

export async function sendBookingConfirmed(lead: any, contractor: any) {
  await sgMail.send({
    to: contractor.email,
    from: 'NeedQuotes <noreply@needquotes.com>',
    subject: `Booking Confirmed! ${lead.trade} in ${lead.zip_code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10B981;">Booking Confirmed! ✅</h2>
        <p>A homeowner has selected you for their <strong>${lead.trade}</strong> project!</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Contact:</strong> ${lead.name}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${lead.phone}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${lead.email}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ZIP ${lead.zip_code}</p>
          <p style="margin: 4px 0;"><strong>Project:</strong> ${lead.problem_type}</p>
        </div>
        <p>Please contact the homeowner to confirm the job details and schedule.</p>
      </div>
    `,
  })
}
