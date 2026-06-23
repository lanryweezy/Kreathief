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
