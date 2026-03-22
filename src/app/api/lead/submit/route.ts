import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLeadNotificationToContractors, sendQuotesReadyToHomeowner } from '@/lib/email'
import { createHubSpotContact } from '@/lib/hubspot'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

    // Fire HubSpot contact + deal creation (non-blocking)
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
    }).catch(err => console.error('HubSpot error:', err))

    const emailPromises = selectedContractors.map(async (contractor) => {
      await supabase.from('lead_assignments').insert({
        lead_id: leadId,
        contractor_id: contractor.id,
        status: 'notified',
      })

      const bidUrl = `${APP_URL}/contractor/bid/${leadId}?c=${contractor.id}`

      return sendLeadNotificationToContractors({
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
    })

    await Promise.all(emailPromises)

    if (selectedContractors.length > 0) {
      await supabase.from('leads').update({ status: 'contractors_notified' }).eq('id', leadId)

      if (lead.email) {
        const quotesUrl = `${APP_URL}/quotes/${leadId}?code=${leadId.slice(0, 8)}`
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
      }
    }

    return NextResponse.json({ success: true, contractorsNotified: selectedContractors.length })
  } catch (err) {
    console.error('Lead submit error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
