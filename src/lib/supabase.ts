import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lead = {
  id: string
  created_at: string
  trade: string
  problem_type: string
  description: string
  images: string[]
  zip_code: string
  address: string
  name: string
  email: string
  phone: string
  preferred_contact_method: string
  timeline: string
  budget_range: string
  scoring: number
  status: string
  assigned_contractor_id: string
  notes: string
}

export type Contractor = {
  id: string
  created_at: string
  name: string
  company: string
  email: string
  phone: string
  specialty: string
  service_area: string
  license_info: string
  insurance_info: string
  website: string
  status: string
  avg_job_value: number
  notes: string
}
