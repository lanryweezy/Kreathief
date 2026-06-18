## 2025-06-18 - Dropped Confusing Columns
**Learning:** Share links are persisted locally via IndexedDB using `storageService`, not via Supabase. The `share_id` column on the `projects` table was an unused artifact allowing a confusing invalid state (two sources of truth).
**Action:** Always verify if a database column maps to active application code before keeping it. When dropping columns, provide a commented down-migration in the same file since Supabase uses sequential runs.

## 2025-06-18 - Bypassing RLS For Safe Updates
**Learning:** To allow users to safely update specific fields (e.g., incrementing `likes` in `community_templates`) without granting them general `UPDATE` permissions via RLS, a `SECURITY DEFINER` PL/pgSQL RPC function is the correct architectural pattern.
**Action:** When implementing incrementers or counters that standard users must invoke, use an RPC rather than opening up the table's UPDATE policy.
