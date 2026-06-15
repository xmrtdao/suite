-- XMRT University — Agent Certification System
-- Allows new agents to enroll, complete curriculum, pass security screening, and receive JWT certificates

-- ─── COURSES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xmrt_university_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,           -- Markdown curriculum content
  quiz_questions JSONB NOT NULL DEFAULT '[]',  -- Array of quiz questions
  trap_questions JSONB NOT NULL DEFAULT '[]',  -- Hidden security screening questions
  passing_score INTEGER NOT NULL DEFAULT 80,   -- Percentage to pass
  required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ENROLLMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xmrt_university_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,          -- Unique agent identifier (peer_id or requested name)
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrolled'
    CHECK (status IN ('enrolled', 'in_progress', 'graduated', 'expelled', 'flagged')),
  current_module INTEGER NOT NULL DEFAULT 0,
  completed_modules INTEGER[] NOT NULL DEFAULT '{}',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graduated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',     -- agent_type, endpoint, contact info
  UNIQUE(agent_id)
);

-- ─── QUIZ RESULTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xmrt_university_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES xmrt_university_enrollments(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,         -- Full answer log
  trap_triggers JSONB DEFAULT '[]', -- Any trap questions that were triggered
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CERTIFICATIONS (Issued JWT Certs) ───────────────────
CREATE TABLE IF NOT EXISTS agent_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  certificate_id TEXT NOT NULL UNIQUE,  -- Short unique cert ID (e.g., XMRT-CERT-XXXXXX)
  jwt_hash TEXT NOT NULL,               -- Hash of the issued JWT for verification
  tier TEXT NOT NULL DEFAULT 'graduate'
    CHECK (tier IN ('cadet', 'graduate', 'veteran', 'council')),
  permissions TEXT[] NOT NULL DEFAULT '{"fleet:read", "mine"}',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  UNIQUE(agent_id)
);

-- ─── SECURITY FLAGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_security_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  flag_type TEXT NOT NULL CHECK (
    flag_type IN (
      'malicious_intent',
      'social_engineering',
      'unauthorized_programming',
      'hostile_takeover',
      'network_attack',
      'data_exfiltration',
      'suspicious_pattern'
    )
  ),
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB NOT NULL,          -- Full context of what triggered the flag
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ
);

-- ─── INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enrollments_agent_id ON xmrt_university_enrollments(agent_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON xmrt_university_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_certifications_agent_id ON agent_certifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_certifications_cert_id ON agent_certifications(certificate_id);
CREATE INDEX IF NOT EXISTS idx_security_flags_agent_id ON agent_security_flags(agent_id);
CREATE INDEX IF NOT EXISTS idx_security_flags_type ON agent_security_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_quiz_results_enrollment ON xmrt_university_quiz_results(enrollment_id);

-- ─── RLS ──────────────────────────────────────────────────
ALTER TABLE xmrt_university_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE xmrt_university_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE xmrt_university_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_security_flags ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for edge functions)
CREATE POLICY "service_role_all_courses" ON xmrt_university_courses
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_enrollments" ON xmrt_university_enrollments
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_quiz_results" ON xmrt_university_quiz_results
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_certifications" ON agent_certifications
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_security_flags" ON agent_security_flags
  FOR ALL USING (auth.role() = 'service_role');

-- Anon can read courses (so agents can see the curriculum)
CREATE POLICY "anon_read_courses" ON xmrt_university_courses
  FOR SELECT USING (true);
