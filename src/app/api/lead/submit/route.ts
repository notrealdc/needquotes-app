import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLeadNotificationToContractors, sendQuotesReadyToHomeowner } from '@/lib/email'
import { createHubSpotContact } from '@/lib/hubspot'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://needquotes-app.vercel.app'

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })
    }

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Fetch and filter contractors — only those with valid emails
    const { data: contractors, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('specialty', lead.trade)
      .eq('status', 'pending')

    if (contractorError) {
      console.error('Contractor fetch error:', contractorError)
      return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 })
    }

    const selectedContractors = (contractors || [])
      .filter(c => VALID_EMAIL.test(c.email))
      .slice(0, 3)

    console.log(`[Lead Submit] ${lead.name} (${lead.trade}) — ${selectedContractors.length} contractors matched`)

    // Create HubSpot contact + deal (non-blocking)
    createHubSpotContact({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      zip_code: lead.zip_code,
      trade: lead.trade,
      problem_type: lead.problem_type,
      timeline: lead.timeline,
      budget_range: lead.budget_range,
      description: lead.description,
    }).catch(err => console.error('HubSpot error (non-blocking):', err))

    // Send emails to contractors
    const emailErrors: string[] = []
    for (const contractor of selectedContractors) {
      try {
        await supabase.from('lead_assignments').insert({
          lead_id: leadId,
          contractor_id: contractor.id,
          status: 'notified',
        })

        const bidUrl = `${APP_URL}/contractor/bid/${leadId}?c=${contractor.id}`

        await sendLeadNotificationToContractors({
          contractorEmail: contractor.email,
          contractorName: contractor.name,
          leadName: lead.name,
          leadPhone: lead.phone,
          trade: lead.trade,
          problemType: lead.problem_type,
          zipCode: lead.zip_code,
          timeline: lead.timeline,
          budget: lead.budget_range || '',
          description: lead.description || undefined,
          bidUrl,
        })
        console.log(`[Email] Sent to ${contractor.email}`)
      } catch (emailErr) {
        const msg = `Failed to email ${contractor.email}: ${emailErr}`
        console.error(msg)
        emailErrors.push(msg)
      }
    }

    // Update lead status + send homeowner confirmation
    if (selectedContractors.length > 0) {
      await supabase.from('leads').update({ status: 'contractors_notified' }).eq('id', leadId)

      if (lead.email) {
        const quotesUrl = `${APP_URL}/quotes/${leadId}?code=${leadId.slice(0, 8)}`
        try {
          await sendQuotesReadyToHomeowner({
            homeownerEmail: lead.email,
            homeownerName: lead.name,
            trade: lead.trade,
            problemType: lead.problem_type,
            timeline: lead.timeline,
            zipCode: lead.zip_code,
            quotesUrl,
            contractorCount: selectedContractors.length,
          })
          console.log(`[Email] Confirmation sent to homeowner ${lead.email}`)
        } catch (homeErr) {
          console.error(`Homeowner email failed: ${homeErr}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      contractorsNotified: selectedContractors.length,
      emailErrors,
    })
  } catch (err) {
    console.error('Lead submit route error:', err)
    return NextResponse.json({ error: 'Internal error', details: String(err) }, { status: 500 })
  }
}
