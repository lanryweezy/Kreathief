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
-- UPDATE profiles SET plan = 'team' WHERE plan = 'enterprise';
-- UPDATE kreathief.profiles SET plan = 'team' WHERE plan = 'enterprise';
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
-- ALTER TABLE kreathief.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'team'));
-- ALTER TABLE kreathief.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'team'));
