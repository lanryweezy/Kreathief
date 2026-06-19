-- Migration 004: Enhance community_templates, add share_links, extend profiles
-- 💡 What: Adds thumbnail, tags, downloads, remix tracking to community;
--          adds share_links table for cross-device sharing;
--          extends profiles with bio, social links, portfolio visibility.
-- 🎯 Why: Community is currently hardcoded; share links are IndexedDB-only;
--          user profiles have no public-facing data.

-- ============================================
-- COMMUNITY_TEMPLATES: Add missing columns
-- ============================================
ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS downloads INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS remix_of TEXT REFERENCES community_templates(id) ON DELETE SET NULL;
ALTER TABLE community_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_community_templates_tags ON community_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_community_templates_remix_of ON community_templates(remix_of);
CREATE INDEX IF NOT EXISTS idx_community_templates_downloads ON community_templates(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_community_templates_created_at ON community_templates(created_at DESC);

-- RPC: increment downloads
CREATE OR REPLACE FUNCTION increment_template_downloads(template_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE community_templates
  SET downloads = downloads + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: decrement likes (for unlike)
CREATE OR REPLACE FUNCTION decrement_template_likes(template_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE community_templates
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to update (for likes/downloads)
DROP POLICY IF EXISTS "Users can update community templates" ON community_templates;
CREATE POLICY "Users can update community templates"
  ON community_templates FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own
DROP POLICY IF EXISTS "Users can delete their own community templates" ON community_templates;
CREATE POLICY "Users can delete their own community templates"
  ON community_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SHARE_LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  is_public BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_project_id ON share_links(project_id);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Anyone can resolve a share link (for viewing shared designs)
DROP POLICY IF EXISTS "Anyone can view share links" ON share_links;
CREATE POLICY "Anyone can view share links"
  ON share_links FOR SELECT
  USING (true);

-- Authenticated users can create share links for their own projects
DROP POLICY IF EXISTS "Users can create share links" ON share_links;
CREATE POLICY "Users can create share links"
  ON share_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own share links
DROP POLICY IF EXISTS "Users can update their own share links" ON share_links;
CREATE POLICY "Users can update their own share links"
  ON share_links FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own share links
DROP POLICY IF EXISTS "Users can delete their own share links" ON share_links;
CREATE POLICY "Users can delete their own share links"
  ON share_links FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PROFILES: Extend with bio, social, portfolio
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- PROJECTS: Add public visibility support
-- ============================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_projects_share_id ON projects(share_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

-- RLS: anyone can view public projects
DROP POLICY IF EXISTS "Anyone can view public projects" ON projects;
CREATE POLICY "Anyone can view public projects"
  ON projects FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- ============================================
-- VIEWS: Add community_templates to Supabase types
-- ============================================
-- (TypeScript types will be updated separately)
