CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
    description TEXT, metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tenant_id, user_id)
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.pfp_leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.pfp_contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.pfp_campaigns ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.jobby_leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.dao_members ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.fleet_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.agent_tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

CREATE OR REPLACE FUNCTION public.set_current_tenant(p_tenant_id UUID) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_tenant() RETURNS UUID AS $$
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

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pfp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobby_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.user_profiles
    FOR ALL USING (tenant_id IS NULL OR tenant_id = public.get_current_tenant())
    WITH CHECK (tenant_id IS NULL OR tenant_id = public.get_current_tenant());

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.agent_profiles
    FOR ALL USING (tenant_id IS NULL OR tenant_id = public.get_current_tenant())
    WITH CHECK (tenant_id IS NULL OR tenant_id = public.get_current_tenant());

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.pfp_leads
    FOR ALL USING (tenant_id IS NULL OR tenant_id = public.get_current_tenant())
    WITH CHECK (tenant_id IS NULL OR tenant_id = public.get_current_tenant());

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.jobby_leads
    FOR ALL USING (tenant_id IS NULL OR tenant_id = public.get_current_tenant())
    WITH CHECK (tenant_id IS NULL OR tenant_id = public.get_current_tenant());

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.fleet_messages
    FOR ALL USING (tenant_id IS NULL OR tenant_id = public.get_current_tenant())
    WITH CHECK (tenant_id IS NULL OR tenant_id = public.get_current_tenant());

CREATE OR REPLACE POLICY tenant_isolation_policy ON public.agent_tasks
    FOR ALL USING (tenant_id IS NULL OR tenant_id = public.get_current_tenant())
    WITH CHECK (tenant_id IS NULL OR tenant_id = public.get_current_tenant());

INSERT INTO public.tenants (id, name, slug, description)
VALUES ('00000000-0000-0000-0000-000000000000', 'legacy', 'legacy', 'Default tenant for existing data')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.user_profiles SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.agent_profiles SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.pfp_leads SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.jobby_leads SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.dao_members SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.fleet_messages SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.agent_tasks SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
