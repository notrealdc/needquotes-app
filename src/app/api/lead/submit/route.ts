import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://needquotes-app.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId } = body

    if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const { data: contractors } = await supabase
      .from('contractors')
      .select('*')
      .eq('specialty', lead.trade)
      .eq('status', 'pending')

    const selectedContractors = (contractors || []).slice(0, 3)

    for (const contractor of selectedContractors) {
      await supabase.from('lead_assignments').insert({
        lead_id: leadId,
        contractor_id: contractor.id,
        status: 'notified',
      })

      const bidUrl = `${APP_URL}/contractor/bid/${leadId}?c=${contractor.id}`

      await sgMail.send({
        to: contractor.email,
        from: 'NeedQuotes <zane47231@gmail.com>',
        subject: `New Lead: ${lead.trade} - ${lead.problem_type} in ZIP ${lead.zip_code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">🚨 New Lead Alert — ${lead.trade}</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
              <h3 style="margin-top: 0;">Lead Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 4px 0; color: #666;"><strong>Name:</strong></td><td>${lead.name}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;"><strong>Phone:</strong></td><td>${lead.phone}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;"><strong>ZIP Code:</strong></td><td>${lead.zip_code}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;"><strong>Problem:</strong></td><td>${lead.problem_type}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;"><strong>Timeline:</strong></td><td>${lead.timeline}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;"><strong>Budget:</strong></td><td>${lead.budget_range || 'Not specified'}</td></tr>
                ${lead.description ? `<tr><td style="padding: 4px 0; color: #666;"><strong>Description:</strong></td><td>${lead.description}</td></tr>` : ''}
              </table>
            </div>
            <a href="${bidUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 10px 0;">Submit Your Quote →</a>
            <p style="color: #888; font-size: 12px; margin-top: 20px;">This is an <strong>exclusive lead</strong> — only you have this link. Submit your quote to be featured on the homeowner's quote comparison page.</p>
          </div>
        `,
      })
    }

    if (selectedContractors.length > 0) {
      await supabase.from('leads').update({ status: 'contractors_notified' }).eq('id', leadId)

      if (lead.email) {
        const quotesUrl = `${APP_URL}/quotes/${leadId}?code=${leadId.slice(0, 8)}`
        await sgMail.send({
          to: lead.email,
          from: 'NeedQuotes <zane47231@gmail.com>',
          subject: `${selectedContractors.length} Contractors Are Preparing Your Quotes! ⏱️`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a2e;">${selectedContractors.length} Contractors Are Preparing Quotes! 🎉</h2>
              <p>We've notified <strong>${selectedContractors.length} verified ${lead.trade} contractors</strong> in your area about your ${lead.problem_type} project.</p>
              <p>You'll get an email as soon as quotes start coming in. Most homeowners receive all their quotes within <strong>10 minutes</strong>.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Project</h3>
                <p style="margin: 4px 0;"><strong>Type:</strong> ${lead.trade} — ${lead.problem_type}</p>
                <p style="margin: 4px 0;"><strong>Timeline:</strong> ${lead.timeline}</p>
                <p style="margin: 4px 0;"><strong>ZIP:</strong> ${lead.zip_code}</p>
              </div>
              <a href="${quotesUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View Quotes (Coming Soon) →</a>
            </div>
          `,
        })
      }
    }

    return NextResponse.json({ success: true, contractorsNotified: selectedContractors.length })
  } catch (err) {
    console.error('Lead submit error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}


