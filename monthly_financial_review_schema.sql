-- XMRT DAO - Monthly Financial Review Tracking
-- Track progress toward $10K MRR (PFP) and $50K ARR (XMRT-DAO) goals

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create monthly_financial_reviews table
CREATE TABLE IF NOT EXISTS public.monthly_financial_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Review Period
    review_month DATE NOT NULL,
    -- e.g., '2026-05-01' for May 2026
    
    -- Party Favor Photo Metrics
    pfp_leads_total INT DEFAULT 0,
    pfp_leads_contacted INT DEFAULT 0,
    pfp_partnerships_active INT DEFAULT 0,
    pfp_bookings_count INT DEFAULT 0,
    pfp_revenue DECIMAL(10,2) DEFAULT 0.00,
    pfp_mrr DECIMAL(10,2) DEFAULT 0.00,
    pfp_mrr_target DECIMAL(10,2) DEFAULT 10000.00,
    pfp_mrr_progress DECIMAL(5,2) DEFAULT 0.00,
    -- Calculated: (pfp_mrr / pfp_mrr_target) * 100
    
    -- XMRT-DAO Metrics
    xmt_university_enrollments INT DEFAULT 0,
    xmt_university_revenue DECIMAL(10,2) DEFAULT 0.00,
    xmt_muapi_generations INT DEFAULT 0,
    xmt_muapi_revenue DECIMAL(10,2) DEFAULT 0.00,
    xmt_fleet_saas_clients INT DEFAULT 0,
    xmt_fleet_saas_revenue DECIMAL(10,2) DEFAULT 0.00,
    xmt_consulting_contracts INT DEFAULT 0,
    xmt_consulting_revenue DECIMAL(10,2) DEFAULT 0.00,
    xmt_total_arr DECIMAL(10,2) DEFAULT 0.00,
    xmt_arr_target DECIMAL(10,2) DEFAULT 50000.00,
    xmt_arr_progress DECIMAL(5,2) DEFAULT 0.00,
    -- Calculated: (xmt_total_arr / xmt_arr_target) * 100
    
    -- Combined Metrics
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    total_mrr DECIMAL(10,2) DEFAULT 0.00,
    total_arr DECIMAL(10,2) DEFAULT 0.00,
    
    -- Goals & Targets
    goals_met TEXT[],
    -- Array of goal names that were achieved
    
    goals_missed TEXT[],
    -- Array of goal names that were not achieved
    
    -- Key Wins
    key_wins TEXT[],
    -- Array of major accomplishments this month
    
    -- Challenges
    challenges TEXT[],
    -- Array of obstacles faced
    
    -- Action Items
    action_items JSONB DEFAULT '[]'::jsonb,
    -- Array of {task, owner, due_date, priority}
    
    -- Next Month Goals
    next_month_goals JSONB DEFAULT '[]'::jsonb,
    -- Array of {goal, target, metric}
    
    -- Review Notes
    notes TEXT,
    
    -- Review Metadata
    reviewed_by TEXT,
    -- e.g., 'Hermes', 'Joey', 'XMRT DAO Team'
    
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(review_month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_month ON public.monthly_financial_reviews(review_month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_pfp_mrr ON public.monthly_financial_reviews(pfp_mrr);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_xmt_arr ON public.monthly_financial_reviews(xmt_total_arr);

-- Create view for goal progress dashboard
CREATE OR REPLACE VIEW public.financial_goal_dashboard AS
SELECT 
    review_month,
    -- PFP Progress
    pfp_mrr,
    pfp_mrr_target,
    pfp_mrr_progress,
    -- XMRT Progress
    xmt_total_arr,
    xmt_arr_target,
    xmt_arr_progress,
    -- Combined
    total_revenue,
    total_mrr,
    total_arr,
    -- Timeline
    created_at,
    -- Quarters
    DATE_TRUNC('quarter', review_month) AS quarter,
    -- Year
    EXTRACT(YEAR FROM review_month) AS year
FROM public.monthly_financial_reviews
ORDER BY review_month DESC;

-- Create view for revenue breakdown by stream
CREATE OR REPLACE VIEW public.revenue_by_stream AS
SELECT 
    review_month,
    'PFP Bookings' AS stream,
    pfp_revenue AS revenue
FROM public.monthly_financial_reviews
UNION ALL
SELECT 
    review_month,
    'XMRT University' AS stream,
    xmt_university_revenue AS revenue
FROM public.monthly_financial_reviews
UNION ALL
SELECT 
    review_month,
    'MUAPI' AS stream,
    xmt_muapi_revenue AS revenue
FROM public.monthly_financial_reviews
UNION ALL
SELECT 
    review_month,
    'Fleet SaaS' AS stream,
    xmt_fleet_saas_revenue AS revenue
FROM public.monthly_financial_reviews
UNION ALL
SELECT 
    review_month,
    'Consulting' AS stream,
    xmt_consulting_revenue AS revenue
FROM public.monthly_financial_reviews
ORDER BY review_month DESC, stream;

-- Create view for monthly trends
CREATE OR REPLACE VIEW public.monthly_revenue_trends AS
SELECT 
    review_month,
    total_revenue,
    total_mrr,
    total_arr,
    -- Month-over-month growth
    LAG(total_revenue) OVER (ORDER BY review_month) AS prev_month_revenue,
    ROUND(
        (total_revenue - LAG(total_revenue) OVER (ORDER BY review_month)) / 
        NULLIF(LAG(total_revenue) OVER (ORDER BY review_month), 0) * 100, 
        2
    ) AS mom_growth_pct,
    -- Year-to-date total
    SUM(total_revenue) OVER (
        PARTITION BY EXTRACT(YEAR FROM review_month) 
        ORDER BY review_month
    ) AS ytd_revenue
FROM public.monthly_financial_reviews
ORDER BY review_month DESC;

-- Create function to auto-calculate progress percentages
CREATE OR REPLACE FUNCTION calculate_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- PFP MRR Progress
    NEW.pfp_mrr_progress := ROUND((NEW.pfp_mrr / NEW.pfp_mrr_target) * 100, 2);
    
    -- XMRT ARR Progress
    NEW.xmt_arr_progress := ROUND((NEW.xmt_total_arr / NEW.xmt_arr_target) * 100, 2);
    
    -- Calculate totals
    NEW.total_revenue := COALESCE(NEW.pfp_revenue, 0) + 
                         COALESCE(NEW.xmt_university_revenue, 0) + 
                         COALESCE(NEW.xmt_muapi_revenue, 0) + 
                         COALESCE(NEW.xmt_fleet_saas_revenue, 0) + 
                         COALESCE(NEW.xmt_consulting_revenue, 0);
    
    NEW.total_mrr := COALESCE(NEW.pfp_mrr, 0) + 
                     (COALESCE(NEW.xmt_fleet_saas_revenue, 0) / 12);
    
    NEW.total_arr := COALESCE(NEW.pfp_mrr, 0) * 12 + 
                     COALESCE(NEW.xmt_total_arr, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate on insert/update
CREATE TRIGGER calculate_financial_progress
    BEFORE INSERT OR UPDATE ON public.monthly_financial_reviews
    FOR EACH ROW
    EXECUTE FUNCTION calculate_goal_progress();

-- Enable Row Level Security
ALTER TABLE public.monthly_financial_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read reviews"
    ON public.monthly_financial_reviews
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert reviews"
    ON public.monthly_financial_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update reviews"
    ON public.monthly_financial_reviews
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow service role full access"
    ON public.monthly_financial_reviews
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.monthly_financial_reviews TO postgres;
GRANT ALL ON public.monthly_financial_reviews TO authenticated;
GRANT ALL ON public.monthly_financial_reviews TO service_role;
GRANT ALL ON public.financial_goal_dashboard TO authenticated;
GRANT ALL ON public.revenue_by_stream TO authenticated;
GRANT ALL ON public.monthly_revenue_trends TO authenticated;

-- Comment
COMMENT ON TABLE public.monthly_financial_reviews IS 'XMRT DAO - Monthly financial review tracking for $10K MRR (PFP) and $50K ARR (XMRT-DAO) goals';
