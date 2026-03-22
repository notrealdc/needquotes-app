import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function twiML(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    }
  )
}

// Twilio webhook to receive SMS and save to leads
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const to = formData.get('To') as string

    if (!from || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    console.log(`📱 SMS from ${from} to ${to}: ${body}`)

    // Strip +1 from phone
    const phone = from.replace(/^\+1/, '')

    // Check if this number already exists as a lead
    const { data: existing } = await supabase
      .from('leads')
      .select('id, name')
      .eq('phone', phone)
      .single()

    if (existing) {
      return twiML('Thanks! We already have your info. A contractor will be in touch shortly.')
    }

    // Create a new lead from this SMS
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        name: 'SMS Lead',
        phone,
        trade: 'Unknown',
        problem_type: body.slice(0, 100),
        zip_code: 'Unknown',
        timeline: 'ASAP',
        status: 'new',
        description: `Initial SMS: ${body}`,
      })
      .select('id')
      .single()

    if (error) {
      console.error('SMS lead insert error:', error)
    } else {
      console.log(`✅ SMS lead created: ${newLead.id}`)
    }

    return twiML('Thanks for texting NeedQuotes! Fill out our quick form at https://needquotes-app.vercel.app to get matched with a contractor.')
  } catch (err) {
    console.error('SMS webhook error:', err)
    return twiML('Something went wrong. Please try again.')
  }
}

// Handle incoming calls
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('From')
  const to = req.nextUrl.searchParams.get('To')

  console.log(`📞 Call from ${from} to ${to}`)

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Thank you for calling NeedQuotes. Please visit our website to submit a request. Goodbye.</Say><Hangup/></Response>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    }
  )
}
