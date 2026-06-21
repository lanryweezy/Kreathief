## 2024-05-18 - Constraint Enforcement with Existing Data

**Learning:** When adding CHECK length constraints to existing string columns that may already have uncontrolled data in production (e.g., `projects.description`), the migration will fail if a single row violates the constraint. Therefore, you must write a sanitization `UPDATE` statement that explicitly cleans or truncates the violating data (e.g. `UPDATE projects SET description = substring(description FROM 1 FOR 2000) WHERE char_length(description) > 2000`) before declaring the `ALTER TABLE ADD CONSTRAINT` rule.

**Action:** Whenever adding a new `CHECK` constraint that limits data length, ensure there's an `UPDATE` data truncation step strictly placed before the constraint enforcement.
