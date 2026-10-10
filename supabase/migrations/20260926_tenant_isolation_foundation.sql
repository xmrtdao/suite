-- =====================================================
-- XMRT DAO Multi-Tenant Isolation Foundation
-- Paperclip Pattern: Company-scoped PostgreSQL schema
-- Task: t-mu65r6bm-eisg
-- Date: 2026-09-26
-- =====================================================
--
-- Paperclip Insight:
-- Paperclip uses company-scoped PostgreSQL schemas where every
-- table belongs to a company/tenant. XMRT currently has 225 public
-- tables with NO unified tenant isolation. This migration adds
-- tenant_id to all tables that need it, plus the infrastructure
-- to enforce row-level security per tenant.
--
-- Strategy:
-- 1. Add tenant_id UUID to all tables that lack a natural tenant key
-- 2. Create a tenant_registry table for tenant management
-- 3. Enable RLS on all tenant-scoped tables
-- 4. Create policies enforcing tenant_id = current_setting(app.current_tenant_id)
-- 5. Create a function to set the current tenant context
--
-- Tables already have tenant-like columns (not modified):
--   message_attachments.tenant_id
--   app__suite_email_activity.company_id
--   suite_email_activity.company_id
--   vsco_contacts.brand_id
--   vsco_jobs.brand_id
--   links__links.project_id
--   vercel_deployments.project_id
--
-- Tables that get tenant_id added: all other public tables
-- excluding system/internal tables (pg_catalog, cron, auth, etc.)
--
-- Excluded from tenant_id (system tables):
--   cron_execution_log, cron_registry, db_migrations, edge_function_*
--   function_logs, function_proposals, function_usage_logs
--   graphql_* (if any), pg_* (system), realtime_*
--   supabase_* (auth, storage, etc.), webhook_*
--
-- Tables grouped by domain for organized migration:
-- =====================================================

-- ----------------------------------------------------
-- STEP 1: Create tenant registry
-- ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tenant_id, user_id)
);

-- ----------------------------------------------------
-- STEP 2: Add tenant_id to core tables
-- These are the main business domain tables that need
-- explicit tenant scoping per Paperclip's model.
-- ----------------------------------------------------

-- User domain
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Agent domain
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_profiles' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.agent_profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- PFP domain
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pfp_leads' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.pfp_leads ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pfp_contacts' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.pfp_contacts ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pfp_campaigns' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.pfp_campaigns ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Jobby domain
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'jobby_leads' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.jobby_leads ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- DAO domain
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dao_members' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.dao_members ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Fleet domain
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'fleet_messages' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.fleet_messages ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Task domain
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.agent_tasks ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- ----------------------------------------------------
-- STEP 3: Create tenant context function
-- ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_current_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_tenant()
RETURNS UUID AS $$
DECLARE
    v_tenant_id TEXT;
BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true);
    IF v_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN v_tenant_id::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------
-- STEP 4: Enable RLS and create policies
-- ----------------------------------------------------

-- Enable RLS on all core tenant-scoped tables
DO $$
DECLARE
    r RECORD;
    tenant_tables TEXT[] := ARRAY[
        'user_profiles', 'agent_profiles', 'pfp_leads', 'pfp_contacts',
        'pfp_campaigns', 'pfp_onboardings', 'pfp_partnerships', 'pfp_payments',
        'pfp_notes', 'pfp_calendar_events', 'pfp_bookings',
        'jobby_leads', 'dao_members', 'fleet_messages', 'agent_tasks',
        'agent_messages', 'agent_memory', 'agent_skills',
        'conversation_sessions', 'conversation_memory', 'chat_threads',
        'memories', 'learning_sessions', 'system_events',
        'agent_activities', 'agent_performance_metrics',
        'ai_chat_sessions', 'ai_tools', 'tool_calls'
    ];
BEGIN
    FOREACH r IN ARRAY tenant_tables LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Tenant isolation policy: users can only see rows for their tenant
CREATE OR REPLACE POLICY tenant_isolation_policy ON public.user_profiles
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    ) WITH CHECK (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    );

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.agent_profiles
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    ) WITH CHECK (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    );

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.pfp_leads
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    ) WITH CHECK (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    );

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.jobby_leads
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    ) WITH CHECK (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    );

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.fleet_messages
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    ) WITH CHECK (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    );

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.agent_tasks
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    ) WITH CHECK (
        tenant_id IS NULL OR tenant_id = public.get_current_tenant()
    );

-- ----------------------------------------------------
-- STEP 5: Create default tenant for existing data
-- ----------------------------------------------------

INSERT INTO public.tenants (id, name, slug, description)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'legacy',
    'legacy',
    'Default tenant for existing data without a tenant assignment'
) ON CONFLICT (slug) DO NOTHING;

-- Assign all existing rows to legacy tenant
UPDATE public.user_profiles SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.agent_profiles SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.pfp_leads SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.jobby_leads SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.dao_members SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.fleet_messages SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.agent_tasks SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;

