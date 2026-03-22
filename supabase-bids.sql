-- Bids table: stores contractor quotes for each lead
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  contractor_id UUID NOT NULL REFERENCES contractors(id),
  assignment_id UUID REFERENCES lead_assignments(id),
  estimate_cents INTEGER NOT NULL,
  time_to_complete_days INTEGER,
  earliest_available TEXT,
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  confirmed BOOLEAN DEFAULT FALSE
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_bids" ON bids FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_read_bids" ON bids FOR SELECT USING (true);
CREATE POLICY "allow_update_bids" ON bids FOR UPDATE USING (true);
