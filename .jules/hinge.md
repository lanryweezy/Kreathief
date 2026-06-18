## 2024-06-18 - Extracted `AnalyticsProvider` Interface from Hardcoded Service

**Learning:** The `AnalyticsService` previously hardcoded calls to Plausible and Google Analytics inside its `track` method, which would require touching the core file every time a new analytics channel was added. By extracting these into self-registering `AnalyticsProvider` implementations, we allow new channels to be added additively.
**Action:** Always look for multiple hardcoded integrations (like multiple analytics providers or notification channels) as a clear signal for a registry pattern.
