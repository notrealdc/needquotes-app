import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { name, email, phone, specialty, service_area, company, license_info, insurance_info } = body

    // Server-side validation
    if (!name || !email || !phone || !specialty || !service_area) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VALID_EMAIL.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (specialty.length > 50) {
      return NextResponse.json({ error: 'Invalid specialty' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('contractors')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone,
        specialty,
        service_area,
        company: company || null,
        license_info: license_info || null,
        insurance_info: insurance_info || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Contractor insert error:', error)
      return NextResponse.json({ error: 'Failed to create contractor account' }, { status: 500 })
    }

    return NextResponse.json({ success: true, contractorId: data.id })
  } catch (err) {
    console.error('Contractor signup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
