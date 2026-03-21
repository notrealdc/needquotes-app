export type Question = {
  id: string
  question: string
  type: 'multiple_choice' | 'text' | 'photo' | 'datetime' | 'budget'
  options?: string[]
  followUpQuestion?: Question
  required: boolean
}

export type TradeConfig = {
  trades: string[]
  problems: Record<string, string[]>
  questions: Record<string, Question[]>
}

export const TRADE_CONFIG: TradeConfig = {
  trades: ['HVAC', 'Roofing', 'Flooring', 'Plumbing', 'Electrical', 'Painting', 'Landscaping', 'General'],
  problems: {
    HVAC: ['AC Not Working', 'Heating Issues', 'Thermostat Problems', 'Maintenance / Tune-Up', 'New Installation', 'Ductwork'],
    Roofing: ['Leak / Water Damage', 'Missing / Damaged Shingles', 'Full Replacement', 'Storm Damage', 'Gutters', 'Inspection'],
    Flooring: ['Hardwood Installation', 'Tile Installation', 'Carpet', 'LVP / Laminate', 'Refinishing', 'Repair'],
    Plumbing: ['Leaky Pipe / Burst', 'Toilet Issues', 'Water Heater', 'Drain Clog', 'Faucet / Fixture', 'Sewer Line'],
    Electrical: ['Panel Upgrade', 'Outlet / Switch Issues', 'Lighting Installation', 'Ceiling Fan', 'EV Charger', 'Generator'],
    Painting: ['Interior', 'Exterior', 'Cabinet Painting', 'Drywall Repair', 'Popcorn Ceiling Removal'],
    Landscaping: ['Lawn Care', 'Tree Service', 'Patio / Hardscape', 'Irrigation', 'Landscape Design'],
    General: ['Additions / Remodel', 'Handyman Work', 'Demolition', 'Inspections'],
  },
  questions: {
    // HVAC Questions
    'HVAC-AC Not Working': [
      { id: 'hvac_type', question: 'What type of AC system do you have?', type: 'multiple_choice', options: ['Central Air', 'Window Unit', 'Ductless Mini-Split', 'Heat Pump', 'Not Sure'], required: true },
      { id: 'hvac_age', question: 'How old is your AC system?', type: 'multiple_choice', options: ['Under 5 years', '5-10 years', '10-15 years', 'Over 15 years', 'Not Sure'], required: true },
      { id: 'hvac_symptoms', question: 'What symptoms are you experiencing?', type: 'multiple_choice', options: ['No cool air at all', 'Warm air blowing', 'Making strange noises', 'Foul smell', 'Water leaking', 'Multiple issues'], required: true },
      { id: 'hvac_photos', question: 'Upload a photo of your AC system (optional)', type: 'photo', required: false },
    ],
    'HVAC-Heating Issues': [
      { id: 'heat_type', question: 'What type of heating system?', type: 'multiple_choice', options: ['Gas Furnace', 'Electric Heat', 'Heat Pump', 'Boiler / Radiator', 'Not Sure'], required: true },
      { id: 'heat_symptom', question: 'What is the heating problem?', type: 'multiple_choice', options: ['No heat at all', 'Not enough heat', 'Heater keeps shutting off', 'Strange noises or smells', 'Thermostat issues'], required: true },
    ],
    'HVAC-Maintenance / Tune-Up': [
      { id: 'hvac_last_service', question: 'When was your last HVAC service?', type: 'multiple_choice', options: ['Never', 'Over 1 year ago', '6-12 months ago', 'Within the last 6 months'], required: true },
    ],
    // Plumbing Questions
    'Plumbing-Leaky Pipe / Burst': [
      { id: 'leak_severity', question: 'How severe is the leak?', type: 'multiple_choice', options: ['Slow drip', 'Steady stream', 'Burst / flooding', 'Not sure'], required: true },
      { id: 'leak_location', question: 'Where is the leak located?', type: 'multiple_choice', options: ['Under sink', 'In wall', 'In ceiling', 'Underground', 'Appliance connection'], required: true },
      { id: 'leak_photos', question: 'Upload a photo of the leak (optional)', type: 'photo', required: false },
      { id: 'water_shutoff', question: 'Have you been able to shut off the water?', type: 'multiple_choice', options: ['Yes', 'No - need help ASAP', 'Not sure how'], required: true },
    ],
    'Plumbing-Toilet Issues': [
      { id: 'toilet_problem', question: 'What type of toilet issue?', type: 'multiple_choice', options: ['Running constantly', 'Won\'t flush', 'Clogged', 'Cracked / leaking', 'Needs replacement', 'Other'], required: true },
      { id: 'toilet_age', question: 'How old is the toilet?', type: 'multiple_choice', options: ['Under 5 years', '5-10 years', '10-20 years', 'Over 20 years', 'Not sure'], required: false },
    ],
    'Plumbing-Water Heater': [
      { id: 'wh_type', question: 'Gas or Electric water heater?', type: 'multiple_choice', options: ['Gas', 'Electric', 'Tankless', 'Not sure'], required: true },
      { id: 'wh_age', question: 'How old is the water heater?', type: 'multiple_choice', options: ['Under 5 years', '5-10 years', '10-15 years', 'Over 15 years'], required: true },
      { id: 'wh_problem', question: 'What\'s the issue?', type: 'multiple_choice', options: ['No hot water', 'Not enough hot water', 'Leaking', 'Rusty water', 'Making noises', 'Pilot light issues'], required: true },
    ],
    // Roofing Questions
    'Roofing-Leak / Water Damage': [
      { id: 'roof_leak_severity', question: 'How bad is the leak?', type: 'multiple_choice', options: ['Minor drip', 'Active stream', 'Significant water damage', 'Emergency - ceiling bulging'], required: true },
      { id: 'roof_leak_location', question: 'Where is the leak inside your home?', type: 'multiple_choice', options: ['Ceiling', 'Wall', 'Attic', 'Multiple areas'], required: true },
      { id: 'roof_damage_photos', question: 'Upload photos of the water damage (optional)', type: 'photo', required: false },
      { id: 'roof_has_attic', question: 'Is there an attic above the leak?', type: 'multiple_choice', options: ['Yes', 'No', 'Not sure'], required: true },
    ],
    'Roofing-Missing / Damaged Shingles': [
      { id: 'roof_damage_extent', question: 'How extensive is the damage?', type: 'multiple_choice', options: ['1-3 shingles', 'Small section', 'Large section', 'Entire roof needs attention'], required: true },
      { id: 'roof_damage_cause', question: 'Do you know what caused the damage?', type: 'multiple_choice', options: ['Storm / wind', 'Age / wear', 'Tree damage', 'Animal damage', 'Not sure'], required: false },
      { id: 'roof_photos', question: 'Upload photos of the roof damage (optional)', type: 'photo', required: false },
    ],
    // Flooring Questions
    'Flooring-Hardwood Installation': [
      { id: 'floor_room', question: 'Which room(s) need flooring?', type: 'multiple_choice', options: ['Living Room', 'Bedroom(s)', 'Kitchen', 'Bathroom(s)', 'Hallway', 'Multiple rooms', 'Entire home'], required: true },
      { id: 'floor_sqft', question: 'Approximate square footage needed:', type: 'multiple_choice', options: ['Under 500 sq ft', '500-1000 sq ft', '1000-2000 sq ft', '2000+ sq ft', 'Not sure'], required: true },
      { id: 'floor_type_preference', question: 'What type of hardwood do you want?', type: 'multiple_choice', options: ['Solid Hardwood', 'Engineered Hardwood', 'LVP / Luxury Vinyl', 'Not sure - need advice'], required: true },
    ],
    'Flooring-Tile Installation': [
      { id: 'tile_room', question: 'Which room(s) need tile?', type: 'multiple_choice', options: ['Bathroom', 'Kitchen', 'Shower', 'Floors', 'Fireplace', 'Other'], required: true },
      { id: 'tile_type', question: 'What type of tile?', type: 'multiple_choice', options: ['Ceramic', 'Porcelain', 'Natural Stone (Marble, Slate)', 'Glass Tile', 'Not sure'], required: false },
    ],
    // Default fallback questions for any trade
    'DEFAULT': [
      { id: 'prob_desc', question: 'Describe the problem in your own words:', type: 'text', required: true },
      { id: 'prob_photos', question: 'Upload any photos of the problem (optional but helpful)', type: 'photo', required: false },
      { id: 'when_started', question: 'When did this problem start?', type: 'multiple_choice', options: ['Just happened / Emergency', 'A few days ago', '1-2 weeks ago', 'A month or more', 'Not sure'], required: true },
    ],
  }
}

export function getQuestionsForProblem(trade: string, problem: string): Question[] {
  const key = `${trade}-${problem}`
  if (TRADE_CONFIG.questions[key]) {
    const specific = TRADE_CONFIG.questions[key]
    const def = TRADE_CONFIG.questions['DEFAULT']
    return [...specific, ...def]
  }
  return TRADE_CONFIG.questions['DEFAULT']
}

export function calculateLeadScore(data: Record<string, any>): number {
  let score = 0
  
  // Timeline scoring
  const timelineMap: Record<string, number> = {
    'Just happened / Emergency': 30,
    'ASAP': 25,
    'Within 1 week': 20,
    'Within 2 weeks': 15,
    'Within a month': 10,
    'Just browsing': 0,
  }
  
  // Budget scoring  
  const budgetMap: Record<string, number> = {
    'Over $10,000': 25,
    '$5,000 - $10,000': 20,
    '$2,000 - $5,000': 15,
    '$1,000 - $2,000': 10,
    'Under $1,000': 5,
    'Not sure': 2,
  }
  
  if (timelineMap[data.timeline]) score += timelineMap[data.timeline]
  if (budgetMap[data.budget_range]) score += budgetMap[data.budget_range]
  
  // Photo uploaded = +15
  if (data.images && data.images.length > 0) score += 15
  
  // Has description = +10
  if (data.description && data.description.length > 20) score += 10
  
  return Math.min(score, 100)
}
