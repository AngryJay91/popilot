-- Epic-Sprint decoupling migration
-- Purpose: Make pm_epics the SSOT, remove nav_epics dependency
-- Epics are global; stories move between sprints.

ALTER TABLE pm_epics ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pm_epics ADD COLUMN origin_sprint TEXT;
