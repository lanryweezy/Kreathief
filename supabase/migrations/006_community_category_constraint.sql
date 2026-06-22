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
