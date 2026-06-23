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
