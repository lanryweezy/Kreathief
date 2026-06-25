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
