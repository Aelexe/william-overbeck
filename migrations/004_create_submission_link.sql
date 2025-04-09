-- Up
CREATE TABLE IF NOT EXISTS submission_link (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_submission_id INTEGER NOT NULL,
    child_submission_id INTEGER NOT NULL,
    link_order INTEGER NOT NULL,
    FOREIGN KEY (parent_submission_id) REFERENCES submission(id) ON DELETE CASCADE,
    FOREIGN KEY (child_submission_id) REFERENCES submission(id) ON DELETE CASCADE,
    UNIQUE (child_submission_id)
);

-- Create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_submission_link_parent ON submission_link(parent_submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_link_child ON submission_link(child_submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_link_order ON submission_link(link_order);

-- Down
DROP INDEX IF EXISTS idx_submission_link_order;
DROP INDEX IF EXISTS idx_submission_link_child;
DROP INDEX IF EXISTS idx_submission_link_parent;
DROP TABLE IF EXISTS submission_link;
