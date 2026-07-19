-- Migration 013: Ensure position and display_order are non-negative
-- 💡 What: Adds CHECK constraints to ensure collection_items.position and marketplace_categories.display_order are >= 0.
-- 🎯 Why: Ordering and positioning columns without range checks can drop below zero due to application logic errors or drag-and-drop bugs, leading to inconsistent UI sorting and data corruption.

-- 1. Ensure existing data conforms. Set any negative metrics to 0.
UPDATE collection_items
SET position = 0
WHERE position < 0;

UPDATE marketplace_categories
SET display_order = 0
WHERE display_order < 0;

-- 2. Add CHECK constraints to prevent future invalid writes
ALTER TABLE collection_items
ADD CONSTRAINT collection_items_position_check
CHECK (position >= 0);

ALTER TABLE marketplace_categories
ADD CONSTRAINT marketplace_categories_display_order_check
CHECK (display_order >= 0);

-- ============================================
-- DOWN MIGRATION
-- ============================================
-- ALTER TABLE marketplace_categories DROP CONSTRAINT IF EXISTS marketplace_categories_display_order_check;
-- ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_position_check;
