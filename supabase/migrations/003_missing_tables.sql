-- Migration to add missing tables: security_logs and community_templates
-- 💡 What: Adds missing `security_logs` and `community_templates` tables and drops unused `share_id` column.
-- 🎯 Why: `logSecurityEvent` and `communityService` were attempting to write to non-existent tables. `share_id` is confusing since share logic lives in IndexedDB.

-- ============================================
-- SECURITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp DESC);

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only allow inserts via the API/Service Role, or authenticated users can insert their own
DROP POLICY IF EXISTS "Users can insert their own security logs" ON security_logs;
CREATE POLICY "Users can insert their own security logs"
  ON security_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'anonymous');

-- ============================================
-- COMMUNITY TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  size TEXT,
  state JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_templates_category ON community_templates(category);
CREATE INDEX IF NOT EXISTS idx_community_templates_likes ON community_templates(likes DESC);

ALTER TABLE community_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view community templates
DROP POLICY IF EXISTS "Anyone can view community templates" ON community_templates;
CREATE POLICY "Anyone can view community templates"
  ON community_templates FOR SELECT
  USING (true);

-- Authenticated users can insert
DROP POLICY IF EXISTS "Users can insert community templates" ON community_templates;
CREATE POLICY "Users can insert community templates"
  ON community_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INCREMENT TEMPLATE LIKES RPC
-- ============================================
CREATE OR REPLACE FUNCTION increment_template_likes(template_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE community_templates
  SET likes = likes + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DROP UNUSED SHARE ID COLUMN
-- ============================================
ALTER TABLE IF EXISTS projects DROP COLUMN IF EXISTS share_id CASCADE;
ALTER TABLE IF EXISTS kreathief.projects DROP COLUMN IF EXISTS share_id CASCADE;

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE IF EXISTS projects ADD COLUMN share_id TEXT UNIQUE;
-- CREATE INDEX IF NOT EXISTS idx_projects_share_id ON projects(share_id);
-- ALTER TABLE IF EXISTS kreathief.projects ADD COLUMN share_id TEXT UNIQUE;
-- CREATE INDEX IF NOT EXISTS idx_projects_share_id ON kreathief.projects(share_id);
-- DROP FUNCTION IF EXISTS increment_template_likes(TEXT);
-- DROP TABLE IF EXISTS community_templates CASCADE;
-- DROP TABLE IF EXISTS security_logs CASCADE;
