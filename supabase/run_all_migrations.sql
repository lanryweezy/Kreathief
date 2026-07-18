-- === 001_initial_schema.sql ===
-- Kreathief Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_plan ON profiles(plan);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  state JSONB NOT NULL DEFAULT '{}',
  canvas_size JSONB,
  background_color TEXT DEFAULT '#ffffff',
  canvas_filters JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  share_id TEXT UNIQUE
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX idx_projects_is_public ON projects(is_public);
CREATE INDEX idx_projects_share_id ON projects(share_id);

-- ============================================
-- PROJECT VERSIONS TABLE (Version History)
-- ============================================
CREATE TABLE IF NOT EXISTS project_versions (
  id TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  version_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX idx_project_versions_user_id ON project_versions(user_id);
CREATE INDEX idx_project_versions_created_at ON project_versions(created_at DESC);

-- ============================================
-- PROJECT SNAPSHOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_snapshots_project_id ON project_snapshots(project_id);
CREATE INDEX idx_project_snapshots_user_id ON project_snapshots(user_id);
CREATE INDEX idx_project_snapshots_created_at ON project_snapshots(created_at DESC);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  text TEXT NOT NULL,
  position JSONB,
  layer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_resolved ON comments(resolved);

-- ============================================
-- BRAND KITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '[]',
  fonts JSONB NOT NULL DEFAULT '[]',
  logos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brand_kits_user_id ON brand_kits(user_id);

-- ============================================
-- TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  state JSONB NOT NULL DEFAULT '{}',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project versions policies
CREATE POLICY "Users can view their own project versions"
  ON project_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project versions"
  ON project_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project versions"
  ON project_versions FOR DELETE
  USING (auth.uid() = user_id);

-- Project snapshots policies
CREATE POLICY "Users can view their own snapshots"
  ON project_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
  ON project_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots"
  ON project_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on their projects"
  ON comments FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = comments.project_id
      AND (projects.user_id = auth.uid() OR projects.is_public = TRUE)
    )
  );

CREATE POLICY "Users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Brand kits policies
CREATE POLICY "Users can view their own brand kits"
  ON brand_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand kits"
  ON brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand kits"
  ON brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand kits"
  ON brand_kits FOR DELETE
  USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can view public templates and their own"
  ON templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert their own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKETS (Optional - for file uploads)
-- ============================================
-- Run this separately in Supabase Dashboard > Storage or via API
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('project-thumbnails', 'project-thumbnails', true),
--        ('user-avatars', 'user-avatars', true),
--        ('template-assets', 'template-assets', true);


-- === 002_isolated_schema.sql ===
-- Kreathief Isolated Database Schema
-- Run this in your Supabase SQL Editor to avoid conflicts with other apps

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS kreathief;

-- Enable UUID extension (usually in public, but referenced here)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kreathief.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON kreathief.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON kreathief.profiles(plan);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kreathief.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES kreathief.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  state JSONB NOT NULL DEFAULT '{}',
  canvas_size JSONB,
  background_color TEXT DEFAULT '#ffffff',
  canvas_filters JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  share_id TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON kreathief.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON kreathief.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON kreathief.projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_share_id ON kreathief.projects(share_id);

-- ============================================
-- PROJECT VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kreathief.project_versions (
  id TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES kreathief.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES kreathief.profiles(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  version_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON kreathief.project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_user_id ON kreathief.project_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_created_at ON kreathief.project_versions(created_at DESC);

-- ============================================
-- PROJECT SNAPSHOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kreathief.project_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES kreathief.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES kreathief.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_snapshots_project_id ON kreathief.project_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_user_id ON kreathief.project_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_project_snapshots_created_at ON kreathief.project_snapshots(created_at DESC);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kreathief.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES kreathief.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES kreathief.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar_url TEXT,
  text TEXT NOT NULL,
  position JSONB,
  layer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parent_id UUID REFERENCES kreathief.comments(id) ON DELETE CASCADE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_comments_project_id ON kreathief.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON kreathief.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON kreathief.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_resolved ON kreathief.comments(resolved);

-- ============================================
-- BRAND KITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kreathief.brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES kreathief.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '[]',
  fonts JSONB NOT NULL DEFAULT '[]',
  logos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON kreathief.brand_kits(user_id);

-- ============================================
-- TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kreathief.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES kreathief.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  state JSONB NOT NULL DEFAULT '{}',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON kreathief.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON kreathief.templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_category ON kreathief.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON kreathief.templates USING GIN(tags);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION kreathief.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON kreathief.profiles
  FOR EACH ROW
  EXECUTE FUNCTION kreathief.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON kreathief.projects
  FOR EACH ROW
  EXECUTE FUNCTION kreathief.update_updated_at_column();

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON kreathief.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION kreathief.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON kreathief.templates
  FOR EACH ROW
  EXECUTE FUNCTION kreathief.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE kreathief.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreathief.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreathief.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreathief.project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreathief.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreathief.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreathief.templates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON kreathief.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON kreathief.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON kreathief.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON kreathief.projects FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert their own projects" ON kreathief.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON kreathief.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON kreathief.projects FOR DELETE USING (auth.uid() = user_id);

-- Project versions policies
CREATE POLICY "Users can view their own project versions" ON kreathief.project_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own project versions" ON kreathief.project_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own project versions" ON kreathief.project_versions FOR DELETE USING (auth.uid() = user_id);

-- Project snapshots policies
CREATE POLICY "Users can view their own snapshots" ON kreathief.project_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own snapshots" ON kreathief.project_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own snapshots" ON kreathief.project_snapshots FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on their projects" ON kreathief.comments FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM kreathief.projects WHERE projects.id = comments.project_id AND (projects.user_id = auth.uid() OR projects.is_public = TRUE)));
CREATE POLICY "Users can insert comments" ON kreathief.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON kreathief.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON kreathief.comments FOR DELETE USING (auth.uid() = user_id);

-- Brand kits policies
CREATE POLICY "Users can view their own brand kits" ON kreathief.brand_kits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own brand kits" ON kreathief.brand_kits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand kits" ON kreathief.brand_kits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand kits" ON kreathief.brand_kits FOR DELETE USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can view public templates and their own" ON kreathief.templates FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert their own templates" ON kreathief.templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON kreathief.templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON kreathief.templates FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION kreathief.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kreathief.profiles (id, email, name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
-- Note: This trigger must be in the auth schema or public schema to monitor auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION kreathief.handle_new_user();


-- === 003_missing_tables.sql ===
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


-- === 004_community_profile_schema.sql ===
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


-- === 005_fix_plan_constraint.sql ===
-- Migration 005: Fix plan ENUM mismatch and add length constraints
-- 💡 What: Updates the profiles.plan CHECK constraint to match TypeScript UserPlan ('enterprise' instead of 'team'). Adds length constraints to name/description columns.
-- 🎯 Why: The app expects 'enterprise' but the DB constraint enforced 'team'. Unbounded text columns risk storage abuse.

-- ============================================
-- PROFILES: Fix plan constraint
-- ============================================
-- First migrate any existing 'team' plans to 'enterprise'
UPDATE profiles SET plan = 'enterprise' WHERE plan = 'team';

-- Drop the old constraint
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find the auto-generated constraint name for the plan CHECK constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'profiles'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%plan%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'enterprise'));

-- ============================================
-- LENGTH CONSTRAINTS
-- ============================================
-- Truncate existing data that might violate the new constraints before applying them
UPDATE projects SET name = substring(name FROM 1 FOR 255) WHERE char_length(name) > 255;
UPDATE projects SET description = substring(description FROM 1 FOR 2000) WHERE char_length(description) > 2000;

UPDATE templates SET name = substring(name FROM 1 FOR 255) WHERE char_length(name) > 255;
UPDATE templates SET description = substring(description FROM 1 FOR 2000) WHERE char_length(description) > 2000;

UPDATE profiles SET name = substring(name FROM 1 FOR 255) WHERE char_length(name) > 255;
UPDATE profiles SET bio = substring(bio FROM 1 FOR 2000) WHERE char_length(bio) > 2000;

UPDATE community_templates SET name = substring(name FROM 1 FOR 255) WHERE char_length(name) > 255;
UPDATE community_templates SET description = substring(description FROM 1 FOR 2000) WHERE char_length(description) > 2000;

-- Apply length constraints
ALTER TABLE projects ADD CONSTRAINT projects_name_length CHECK (char_length(name) <= 255);
ALTER TABLE projects ADD CONSTRAINT projects_desc_length CHECK (description IS NULL OR char_length(description) <= 2000);

ALTER TABLE templates ADD CONSTRAINT templates_name_length CHECK (char_length(name) <= 255);
ALTER TABLE templates ADD CONSTRAINT templates_desc_length CHECK (description IS NULL OR char_length(description) <= 2000);

ALTER TABLE profiles ADD CONSTRAINT profiles_name_length CHECK (name IS NULL OR char_length(name) <= 255);
ALTER TABLE profiles ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 2000);

ALTER TABLE community_templates ADD CONSTRAINT ct_name_length CHECK (char_length(name) <= 255);
ALTER TABLE community_templates ADD CONSTRAINT ct_desc_length CHECK (description IS NULL OR char_length(description) <= 2000);
-- Migration 005: Fix profile plan constraint
-- 💡 What: Updates the check constraint on profiles.plan from ('free', 'pro', 'team') to ('free', 'pro', 'enterprise').
-- 🎯 Why: The application types (types.ts) define UserPlan as 'free' | 'pro' | 'enterprise'. The database allowed 'team' which causes a mismatch and potential invalid state.

-- 1. Backfill any existing data that might violate the new constraint
UPDATE profiles
SET plan = 'enterprise'
WHERE plan = 'team';

UPDATE kreathief.profiles
SET plan = 'enterprise'
WHERE plan = 'team';

-- 2. Drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE kreathief.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 3. Add the new constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'enterprise'));
ALTER TABLE kreathief.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'enterprise'));

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE community_templates DROP CONSTRAINT IF EXISTS ct_desc_length;
-- ALTER TABLE community_templates DROP CONSTRAINT IF EXISTS ct_name_length;
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_bio_length;
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_name_length;
-- ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_desc_length;
-- ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_name_length;
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_desc_length;
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_name_length;
--
-- UPDATE profiles SET plan = 'team' WHERE plan = 'enterprise';
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'team'));
-- UPDATE profiles SET plan = 'team' WHERE plan = 'enterprise';
-- UPDATE kreathief.profiles SET plan = 'team' WHERE plan = 'enterprise';
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
-- ALTER TABLE kreathief.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'team'));
-- ALTER TABLE kreathief.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'team'));


-- === 006_community_category_constraint.sql ===
-- Migration 006: Add check constraint to community_templates.category
-- 💡 What: Enforces valid category values for community templates using a CHECK constraint.
-- 🎯 Why: Categories are just a free-text field allowing any invalid string. The UI relies on specific categories ('Social', 'Video', 'Business', 'Personal', 'Posters', 'Print', 'Corporate') for filtering and presentation. An unbounded string allows inconsistent/invalid categories which breaks the UI filters.

-- 1. Ensure existing categories conform. Set any unknown category to 'Personal'.
UPDATE community_templates
SET category = 'Personal'
WHERE category NOT IN ('Social', 'Video', 'Business', 'Personal', 'Posters', 'Print', 'Corporate');

-- 2. Add the CHECK constraint
ALTER TABLE community_templates
ADD CONSTRAINT community_templates_category_check
CHECK (category IN ('Social', 'Video', 'Business', 'Personal', 'Posters', 'Print', 'Corporate'));

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE community_templates DROP CONSTRAINT IF EXISTS community_templates_category_check;


-- === 007_numeric_range_constraints.sql ===
-- Migration 007: Ensure metric columns are non-negative
-- 💡 What: Adds CHECK constraints to ensure likes, downloads, and view_count are >= 0.
-- 🎯 Why: Counters without range checks can drop below zero due to race conditions or application logic errors (e.g. concurrent unlikes), corrupting analytics data.

-- 1. Ensure existing data conforms. Set any negative metrics to 0.
UPDATE community_templates
SET likes = 0
WHERE likes < 0;

UPDATE community_templates
SET downloads = 0
WHERE downloads < 0;

UPDATE share_links
SET view_count = 0
WHERE view_count < 0;

-- 2. Add CHECK constraints to prevent future invalid writes
ALTER TABLE community_templates
ADD CONSTRAINT community_templates_likes_check
CHECK (likes >= 0);

ALTER TABLE community_templates
ADD CONSTRAINT community_templates_downloads_check
CHECK (downloads >= 0);

ALTER TABLE share_links
ADD CONSTRAINT share_links_view_count_check
CHECK (view_count >= 0);

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE share_links DROP CONSTRAINT IF EXISTS share_links_view_count_check;
-- ALTER TABLE community_templates DROP CONSTRAINT IF EXISTS community_templates_downloads_check;
-- ALTER TABLE community_templates DROP CONSTRAINT IF EXISTS community_templates_likes_check;


-- === 008_performance_indexes.sql ===
-- Migration 008: Performance indexes for common query patterns
-- 💡 What: Adds composite indexes that cover specific query hot paths.
-- 🎯 Why: Single-column indexes exist (from 001_initial_schema) but common
--          queries filter + sort, so a composite index avoids an extra sort step.

-- 1. Projects list: WHERE user_id = X ORDER BY updated_at DESC
--    Covers the dashboard "my projects" query. The composite index keeps
--    results pre-sorted per user, eliminating a filesort.
CREATE INDEX IF NOT EXISTS idx_projects_user_updated
  ON projects (user_id, updated_at DESC);

-- 2. Comment thread: WHERE project_id = X ORDER BY created_at ASC
--    Every project view loads its comments chronologically.
CREATE INDEX IF NOT EXISTS idx_comments_project_created
  ON comments (project_id, created_at);

-- 3. Version history: WHERE project_id = X ORDER BY created_at DESC
--    The version panel shows the most recent versions first.
CREATE INDEX IF NOT EXISTS idx_versions_project_created
  ON project_versions (project_id, created_at DESC);

-- 4. Brand kit list: WHERE user_id = X ORDER BY updated_at
--    The brand kit panel shows kits sorted by last modified.
CREATE INDEX IF NOT EXISTS idx_brand_kits_user_updated
  ON brand_kits (user_id, updated_at);

-- 5. Popular templates: ORDER BY likes DESC
--    The community "most liked" tab. Already exists from 003; kept for
--    completeness with IF NOT EXISTS to avoid errors.
CREATE INDEX IF NOT EXISTS idx_community_templates_likes
  ON community_templates (likes DESC);

-- 6. Share link resolution: WHERE project_id = X
--    Already exists from 004; kept for completeness with IF NOT EXISTS.
CREATE INDEX IF NOT EXISTS idx_share_links_project_id
  ON share_links (project_id);


-- === 009_creator_system.sql ===
-- Migration 009: Creator System
-- Adds creators, assets, and asset_categories tables

-- ============================================
-- CREATORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  portfolio_url TEXT,
  specialization TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_is_verified ON creators(is_verified);
CREATE INDEX idx_creators_specialization ON creators(specialization);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creators"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own creator profile"
  ON creators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creator profile"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- ASSET_CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT
);

CREATE INDEX idx_asset_categories_name ON asset_categories(name);

ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view asset categories"
  ON asset_categories FOR SELECT
  USING (true);

-- ============================================
-- ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_creator_id ON assets(creator_id);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_downloads ON assets(downloads DESC);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX idx_assets_price ON assets(price);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved assets"
  ON assets FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Creators can view their own assets"
  ON assets FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert their own assets"
  ON assets FOR INSERT
  WITH CHECK (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update their own assets"
  ON assets FOR UPDATE
  USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete their own assets"
  ON assets FOR DELETE
  USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- SEED CATEGORIES
-- ============================================
INSERT INTO asset_categories (name, icon) VALUES
  ('Icons', 'icon'),
  ('Illustrations', 'illustration'),
  ('UI Kits', 'ui-kit'),
  ('Templates', 'template'),
  ('Fonts', 'font'),
  ('Photos', 'photo'),
  ('3D Models', '3d-model'),
  ('Audio', 'audio')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- RPC: increment asset downloads
-- ============================================
CREATE OR REPLACE FUNCTION increment_asset_downloads(asset_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE assets
  SET downloads = downloads + 1
  WHERE id = asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === 010_template_marketplace.sql ===
-- Migration 010: Template Marketplace

CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_categories_slug ON marketplace_categories(slug);
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view marketplace categories" ON marketplace_categories FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS marketplace_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  template_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_templates_author_id ON marketplace_templates(author_id);
CREATE INDEX idx_marketplace_templates_category ON marketplace_templates(category);
CREATE INDEX idx_marketplace_templates_status ON marketplace_templates(status);
CREATE INDEX idx_marketplace_templates_likes ON marketplace_templates(likes DESC);
CREATE INDEX idx_marketplace_templates_downloads ON marketplace_templates(downloads DESC);
CREATE INDEX idx_marketplace_templates_created_at ON marketplace_templates(created_at DESC);
CREATE INDEX idx_marketplace_templates_tags ON marketplace_templates USING GIN(tags);

ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved templates" ON marketplace_templates FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view own pending templates" ON marketplace_templates FOR SELECT USING (author_id = auth.uid());
CREATE POLICY "Authenticated users can submit templates" ON marketplace_templates FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own templates" ON marketplace_templates FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own templates" ON marketplace_templates FOR DELETE USING (author_id = auth.uid());

INSERT INTO marketplace_categories (name, slug, icon, display_order) VALUES
  ('Posters', 'posters', 'poster', 1), ('Social', 'social', 'social', 2),
  ('Print', 'print', 'print', 3), ('Corporate', 'corporate', 'corporate', 4),
  ('Branding', 'branding', 'branding', 5), ('UI/UX', 'ui-ux', 'ui', 6),
  ('Illustration', 'illustration', 'illustration', 7), ('Other', 'other', 'other', 8)
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION increment_marketplace_template_likes(template_id UUID) RETURNS void AS $$
BEGIN UPDATE marketplace_templates SET likes = likes + 1, updated_at = NOW() WHERE id = template_id; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_marketplace_template_downloads(template_id UUID) RETURNS void AS $$
BEGIN UPDATE marketplace_templates SET downloads = downloads + 1, updated_at = NOW() WHERE id = template_id; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_marketplace_template_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marketplace_templates_updated_at
  BEFORE UPDATE ON marketplace_templates FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_template_timestamp();


-- === 011_asset_curation.sql ===
-- Migration 011: Asset Curation System

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'photo',
  thumbnail_url TEXT,
  asset_url TEXT NOT NULL,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_favorites_created_at ON user_favorites(created_at DESC);
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON user_collections(user_id);
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collections" ON user_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create collections" ON user_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON user_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON user_collections FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  thumbnail_url TEXT,
  provider TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_position ON collection_items(position);
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own collection items" ON collection_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can add collection items" ON collection_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own collection items" ON collection_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own collection items" ON collection_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM user_collections WHERE id = collection_id AND user_id = auth.uid()));

CREATE OR REPLACE FUNCTION update_collection_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON user_collections FOR EACH ROW
  EXECUTE FUNCTION update_collection_timestamp();


-- === 012_marketplace_metrics_constraints.sql ===
-- Migration 012: Ensure marketplace metrics are non-negative
-- 💡 What: Adds CHECK constraints to ensure price and downloads in assets, and likes and downloads in marketplace_templates are >= 0.
-- 🎯 Why: Counters and numeric values without range checks can drop below zero due to race conditions or application logic errors, corrupting data.

-- 1. Ensure existing data conforms. Set any negative metrics to 0.
UPDATE assets
SET price = 0
WHERE price < 0;

UPDATE assets
SET downloads = 0
WHERE downloads < 0;

UPDATE marketplace_templates
SET likes = 0
WHERE likes < 0;

UPDATE marketplace_templates
SET downloads = 0
WHERE downloads < 0;

-- 2. Add CHECK constraints to prevent future invalid writes
ALTER TABLE assets
ADD CONSTRAINT assets_price_check
CHECK (price >= 0);

ALTER TABLE assets
ADD CONSTRAINT assets_downloads_check
CHECK (downloads >= 0);

ALTER TABLE marketplace_templates
ADD CONSTRAINT marketplace_templates_likes_check
CHECK (likes >= 0);

ALTER TABLE marketplace_templates
ADD CONSTRAINT marketplace_templates_downloads_check
CHECK (downloads >= 0);

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE marketplace_templates DROP CONSTRAINT IF EXISTS marketplace_templates_downloads_check;
-- ALTER TABLE marketplace_templates DROP CONSTRAINT IF EXISTS marketplace_templates_likes_check;
-- ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_downloads_check;
-- ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_price_check;
