## 2024-05-18 - Constraint Enforcement with Existing Data

**Learning:** When adding CHECK length constraints to existing string columns that may already have uncontrolled data in production (e.g., `projects.description`), the migration will fail if a single row violates the constraint. Therefore, you must write a sanitization `UPDATE` statement that explicitly cleans or truncates the violating data (e.g. `UPDATE projects SET description = substring(description FROM 1 FOR 2000) WHERE char_length(description) > 2000`) before declaring the `ALTER TABLE ADD CONSTRAINT` rule.

**Action:** Whenever adding a new `CHECK` constraint that limits data length, ensure there's an `UPDATE` data truncation step strictly placed before the constraint enforcement.

## 2025-06-18 - Bypassing RLS For Safe Updates

**Learning:** To allow users to safely update specific fields (e.g., incrementing `likes` in `community_templates`) without granting them general `UPDATE` permissions via RLS, a `SECURITY DEFINER` PL/pgSQL RPC function is the correct architectural pattern.
**Action:** When implementing incrementers or counters that standard users must invoke, use an RPC rather than opening up the table's UPDATE policy.

## 2026-06-21 - Mismatched Application Logic vs Database Enums

**Learning:** When using hardcoded arrays or strings in application logic (`UserPlan = 'free' | 'pro' | 'enterprise'`), it's crucial to map that to the check constraint inside the DB schema `CHECK (plan IN (...))`. In this repo, the database allowed 'team' while the frontend only supported 'enterprise', leading to potential invalid state errors if old values surfaced. Also, always backfill data to prevent migration failures.
**Action:** When updating a `CHECK` constraint, write an `UPDATE` to backfill existing data _before_ replacing the constraint to ensure the migration doesn't crash on violating data.

## 2026-06-22 - Missing Check Constraints on Community Template Categories

**Learning:** The application codebase hardcodes specific categories that the UI depends on for template filtering and display (e.g. `Social`, `Video`, `Business`, `Personal`, `Posters`, `Print`, `Corporate`), but no database constraint was preventing an arbitrary string from being written to the `category` column of `community_templates`. When writing data integrity migrations for check constraints on columns that already contain data, an `UPDATE` block must be executed first to fix or normalize the out-of-bounds strings to an accepted default before the `ALTER TABLE ... ADD CONSTRAINT` step, otherwise Postgres will block the schema change.
**Action:** Always check the current production data types / valid domain for text/varchar columns using frontend enums, and pair `UPDATE` backfills before applying `CHECK` constraints to previously unbounded text fields.
