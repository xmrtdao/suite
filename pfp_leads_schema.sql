-- Party Favor Photo - Partnership Leads Table Schema
-- For tracking wedding planner and venue PARTNERSHIPS (not customer leads)
-- Note: pfp_leads exists for customer bookings; this is for partner referral tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pfp_partnerships table
CREATE TABLE IF NOT EXISTS public.pfp_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contact Info
    email TEXT,
    name TEXT,
    company TEXT,
    phone TEXT,
    website TEXT,
    
    -- Categorization
    category TEXT NOT NULL DEFAULT 'wedding_planner',
    -- Options: wedding_planner, venue, photographer, florist, caterer, dj, decorator
    
    source TEXT NOT NULL,
    -- Options: exa_search, manual_theknot, manual_weddingwire, manual_google, manual_yelp, manual_instagram, manual_facebook, referral
    
    location TEXT,
    -- e.g., "Arlington VA", "Dallas TX", "Northern Virginia"
    
    status TEXT DEFAULT 'new',
    -- Options: new, contacted, responded, meeting_scheduled, partner, not_interested, invalid
    
    -- Partnership Tracking
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    -- Percentage commission (default 15%)
    
    referrals_sent INT DEFAULT 0,
    bookings_completed INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    commission_owed DECIMAL(10,2) DEFAULT 0.00,
    commission_paid DECIMAL(10,2) DEFAULT 0.00,
    
    -- Outreach Tracking
    first_contacted_at TIMESTAMPTZ,
    last_contacted_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    meeting_date TIMESTAMPTZ,
    partnership_start_date TIMESTAMPTZ,
    
    -- Notes & Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    -- Store: snippet, all_emails, social_links, etc.
    
    -- Campaign Association
    campaign_id UUID,
    -- Link to outreach_campaigns table if it exists
    
    -- Constraints
    CONSTRAINT valid_category CHECK (category IN (
        'wedding_planner', 'venue', 'photographer', 'florist', 'caterer', 'dj', 'decorator', 'other'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'new', 'contacted', 'responded', 'meeting_scheduled', 'partner', 'not_interested', 'invalid'
    ))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pfp_partnerships_email ON public.pfp_partnerships(email);
CREATE INDEX IF NOT EXISTS idx_pfp_partnerships_category ON public.pfp_partnerships(category);
CREATE INDEX IF NOT EXISTS idx_pfp_partnerships_status ON public.pfp_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_pfp_partnerships_location ON public.pfp_partnerships(location);
CREATE INDEX IF NOT EXISTS idx_pfp_partnerships_source ON public.pfp_partnerships(source);
CREATE INDEX IF NOT EXISTS idx_pfp_partnerships_created_at ON public.pfp_partnerships(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pfp_partnerships_partners ON public.pfp_partnerships(status) WHERE status = 'partner';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pfp_partnerships_updated_at
    BEFORE UPDATE ON public.pfp_partnerships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - disable if you want open access)
ALTER TABLE public.pfp_partnerships ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read/write
CREATE POLICY "Allow authenticated users to read partnerships"
    ON public.pfp_partnerships
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert partnerships"
    ON public.pfp_partnerships
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update partnerships"
    ON public.pfp_partnerships
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create policy for service role (edge functions)
CREATE POLICY "Allow service role full access"
    ON public.pfp_partnerships
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO public.pfp_leads (email, name, company, category, source, location, status)
-- VALUES 
--     ('melissa@angp.org', 'Melissa Dotimas', 'ANGP', 'wedding_planner', 'manual', 'Washington DC', 'partner'),
--     ('test@example.com', 'Test Planner', 'Test Events', 'wedding_planner', 'exa_search', 'Arlington VA', 'new');

-- Create view for active partners
CREATE OR REPLACE VIEW public.pfp_active_partners AS
SELECT 
    id,
    name,
    company,
    email,
    phone,
    location,
    partnership_start_date,
    referrals_sent,
    bookings_completed,
    total_revenue,
    commission_owed,
    commission_paid
FROM public.pfp_partnerships
WHERE status = 'partner'
ORDER BY partnership_start_date DESC;

-- Create view for leads needing follow-up
CREATE OR REPLACE VIEW public.pfp_needs_followup AS
SELECT 
    id,
    name,
    company,
    email,
    location,
    status,
    first_contacted_at,
    last_contacted_at,
    CASE 
        WHEN last_contacted_at IS NULL THEN 'Initial contact needed'
        WHEN status = 'contacted' AND last_contacted_at < NOW() - INTERVAL '3 days' THEN 'Follow-up #2'
        WHEN status = 'responded' AND last_contacted_at < NOW() - INTERVAL '2 days' THEN 'Schedule meeting'
        ELSE 'No action needed'
    END AS next_action
FROM public.pfp_partnerships
WHERE status IN ('new', 'contacted', 'responded')
ORDER BY last_contacted_at ASC NULLS FIRST;

-- Grant permissions to postgres role
GRANT ALL ON public.pfp_partnerships TO postgres;
GRANT ALL ON public.pfp_partnerships TO authenticated;
GRANT ALL ON public.pfp_partnerships TO service_role;

-- Comment describing the table
COMMENT ON TABLE public.pfp_partnerships IS 'Party Favor Photo - Wedding planner and venue partnership leads';
