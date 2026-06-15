-- Party Favor Photo Booking System
-- Run in Supabase SQL Editor

-- 1. Bookings table
CREATE TABLE IF NOT EXISTS pfp_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Client info
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('StudioStation', 'Wedding', 'Corporate', 'Celebration')),
  event_date DATE NOT NULL,
  event_time TIME,
  duration_hours INT NOT NULL DEFAULT 2,
  venue_name TEXT,
  venue_address TEXT,
  
  -- Package/pricing
  package_name TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  addons JSONB DEFAULT '[]',
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Status workflow: lead -> quoted -> deposit_paid -> confirmed -> completed -> cancelled
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead','quoted','deposit_paid','confirmed','completed','cancelled')),
  deposit_paid BOOLEAN DEFAULT false,
  balance_paid BOOLEAN DEFAULT false,
  stripe_payment_link TEXT,
  stripe_deposit_link TEXT,
  
  -- Details
  notes TEXT,
  template_choice TEXT,
  custom_logo_url TEXT,
  
  -- Lead source tracking
  lead_source TEXT DEFAULT 'campaign',
  campaign_batch TEXT,
  
  -- Attendant assignment
  assigned_attendant TEXT,
  job_sheet_sent BOOLEAN DEFAULT false
);

-- 2. Questionnaires table
CREATE TABLE IF NOT EXISTS pfp_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES pfp_bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Template/style
  template_style TEXT,
  custom_text TEXT,
  logo_url TEXT,
  
  -- Venue logistics
  has_stairs BOOLEAN DEFAULT false,
  loading_zone TEXT,
  parking_notes TEXT,
  special_requests TEXT,
  
  -- Contact
  day_of_contact_name TEXT,
  day_of_contact_phone TEXT
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_pfp_bookings_email ON pfp_bookings(client_email);
CREATE INDEX IF NOT EXISTS idx_pfp_bookings_status ON pfp_bookings(status);
CREATE INDEX IF NOT EXISTS idx_pfp_bookings_date ON pfp_bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_pfp_bookings_source ON pfp_bookings(lead_source);

-- 4. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_pfp_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pfp_booking_updated ON pfp_bookings;
CREATE TRIGGER trg_pfp_booking_updated
  BEFORE UPDATE ON pfp_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_pfp_booking_timestamp();
