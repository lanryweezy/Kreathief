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
