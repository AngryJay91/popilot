-- 007-indexes.sql
-- Add indexes to core tables for query performance
-- All indexes use IF NOT EXISTS for idempotency

-- pm_stories indexes
CREATE INDEX IF NOT EXISTS idx_pm_stories_sprint    ON pm_stories (sprint);
CREATE INDEX IF NOT EXISTS idx_pm_stories_epic_id   ON pm_stories (epic_id);
CREATE INDEX IF NOT EXISTS idx_pm_stories_status    ON pm_stories (status);
CREATE INDEX IF NOT EXISTS idx_pm_stories_assignee  ON pm_stories (assignee);

-- pm_tasks indexes
CREATE INDEX IF NOT EXISTS idx_pm_tasks_story_id  ON pm_tasks (story_id);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_status    ON pm_tasks (status);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_assignee  ON pm_tasks (assignee);

-- pm_epics indexes
CREATE INDEX IF NOT EXISTS idx_pm_epics_status ON pm_epics (status);

-- meetings indexes (COALESCE-friendly: covers both `date` and `meeting_date` columns)
CREATE INDEX IF NOT EXISTS idx_meetings_date         ON meetings (date);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON meetings (meeting_date);

-- members indexes
CREATE INDEX IF NOT EXISTS idx_members_display_name ON members (display_name);

-- nav_sprints indexes
CREATE INDEX IF NOT EXISTS idx_nav_sprints_status ON nav_sprints (status);
