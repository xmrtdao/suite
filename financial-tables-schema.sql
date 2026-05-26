-- XMRT DAO Financial Tables Schema
-- Run in Supabase SQL Editor to enable MUAPI + Referral programs

-- ── MUAPI USERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS muapi_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    tier TEXT DEFAULT 'free', -- free, starter, pro, business, enterprise
    api_key TEXT UNIQUE,
    credits_remaining INT DEFAULT 0,
    monthly_usage INT DEFAULT 0,
    status TEXT DEFAULT 'active'
);

-- ── MUAPI GENERATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS muapi_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES muapi_users(id),
    media_type TEXT NOT NULL, -- image, video, avatar
    prompt TEXT NOT NULL,
    output_url TEXT,
    credits_used INT NOT NULL,
    status TEXT DEFAULT 'processing' -- processing, completed, failed
);

-- ── MUAPI SUBSCRIPTIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS muapi_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES muapi_users(id),
    stripe_subscription_id TEXT UNIQUE,
    tier TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ
);

-- ── PFP REFERRAL CODES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    client_id UUID REFERENCES bookings(client_id),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    uses_count INT DEFAULT 0,
    total_credit_issued DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active' -- active, paused, expired
);

-- ── PFP REFERRAL USES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    referrer_code TEXT REFERENCES referral_codes(code),
    referee_name TEXT NOT NULL,
    referee_email TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    booking_amount DECIMAL(10,2) NOT NULL,
    referrer_credit DECIMAL(10,2) NOT NULL,
    referee_discount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' -- pending, completed, cancelled
);

-- ── REVENUE ENTRIES (PFP + XMRT) ───────────────────────────
CREATE TABLE IF NOT EXISTS revenue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    business_unit TEXT NOT NULL, -- 'pfp' or 'xmrt'
    revenue_stream TEXT NOT NULL,
    customer_name TEXT,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL, -- 'one-time' or 'recurring'
    status TEXT DEFAULT 'pending', -- pending, paid, cancelled
    source TEXT,
    notes TEXT
);

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_muapi_generations_user ON muapi_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_muapi_generations_month ON muapi_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_codes_email ON referral_codes(client_email);
CREATE INDEX IF NOT EXISTS idx_referral_uses_code ON referral_uses(referrer_code);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_business ON revenue_entries(business_unit);

-- ── VIEWS ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW weekly_revenue_summary AS
SELECT 
    DATE_TRUNC('week', created_at) as week,
    business_unit,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count
FROM revenue_entries
WHERE status = 'paid'
GROUP BY week, business_unit
ORDER BY week DESC;

CREATE OR REPLACE VIEW muapi_monthly_usage AS
SELECT 
    u.email,
    u.tier,
    DATE_TRUNC('month', g.created_at) as month,
    COUNT(*) as generations,
    SUM(g.credits_used) as credits_used
FROM muapi_users u
LEFT JOIN muapi_generations g ON u.id = g.user_id
GROUP BY u.email, u.tier, month
ORDER BY month DESC;

-- ── COMMENTS ───────────────────────────────────────────────
COMMENT ON TABLE muapi_users IS 'MUAPI paid service users';
COMMENT ON TABLE muapi_generations IS 'MUAPI generation history + usage tracking';
COMMENT ON TABLE referral_codes IS 'PFP referral program codes';
COMMENT ON TABLE referral_uses IS 'PFP referral usage tracking';
COMMENT ON TABLE revenue_entries IS 'Unified revenue tracking for PFP + XMRT';
