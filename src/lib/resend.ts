import { Resend } from '@resend/node'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendLeadToContractors(lead: any, contractors: any[]) {
  const leadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${lead.id}?code=${lead.id.slice(0, 8)}`
  
  for (const contractor of contractors) {
    const bidUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contractor/bid/${lead.id}?c=${contractor.id}`
    
    await resend.emails.send({
      from: 'NeedQuotes <noreply@needquotes.com>',
      to: contractor.email,
      subject: `New Lead: ${lead.trade} - ${lead.problem_type} in ${lead.zip_code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">New Lead Alert 🚨</h2>
          <p>You have a new lead matching your specialty and service area.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Lead Details</h3>
            <p><strong>Trade:</strong> ${lead.trade}</p>
            <p><strong>Problem:</strong> ${lead.problem_type}</p>
            <p><strong>Location:</strong> ZIP ${lead.zip_code}</p>
            <p><strong>Timeline:</strong> ${lead.timeline}</p>
            <p><strong>Budget:</strong> ${lead.budget_range || 'Not specified'}</p>
            ${lead.description ? `<p><strong>Description:</strong> ${lead.description}</p>` : ''}
          </div>
          
          <a href="${bidUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Submit Your Quote →
          </a>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This lead link is unique to you. Submit your quote by providing your estimate, time to complete, and earliest available date.
          </p>
        </div>
      `,
    })
  }
}

export async function sendQuotesToHomeowner(lead: any) {
  const quotesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${lead.id}?code=${lead.id.slice(0, 8)}`
  
  await resend.emails.send({
    from: 'NeedQuotes <noreply@needquotes.com>',
    to: lead.email,
    subject: `Your ${lead.trade} Quotes Are Ready! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your Quotes Are Ready! 🎉</h2>
        <p>Contractors have submitted their quotes for your <strong>${lead.problem_type}</strong> project.</p>
        
        <a href="${quotesUrl}" style="display: inline-block; background: #10B981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          View Your Quotes →
        </a>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          You'll see each contractor's estimate, timeline, and availability. Pick the one that fits best.
        </p>
      </div>
    `,
  })
}

export async function sendBookingConfirmedToContractor(contractor: any, lead: any) {
  await resend.emails.send({
    from: 'NeedQuotes <noreply@needquotes.com>',
    to: contractor.email,
    subject: `Booking Confirmed! ${lead.trade} in ${lead.zip_code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Booking Confirmed! ✅</h2>
        <p>A homeowner has selected you for their <strong>${lead.trade}</strong> project!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Contact:</strong> ${lead.name}</p>
          <p><strong>Phone:</strong> ${lead.phone}</p>
          <p><strong>Email:</strong> ${lead.email}</p>
          <p><strong>Location:</strong> ZIP ${lead.zip_code}</p>
          <p><strong>Project:</strong> ${lead.problem_type}</p>
        </div>
        
        <p>Please contact the homeowner to confirm the job details and schedule.</p>
      </div>
    `,
  })
}
