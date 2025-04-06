-- Up
CREATE TABLE IF NOT EXISTS submission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL UNIQUE,
    document_hash TEXT DEFAULT NULL,
    submitter TEXT NOT NULL,
    is_downloaded BOOLEAN DEFAULT FALSE,
    content TEXT DEFAULT NULL,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submission_date_submitted ON submission(date_submitted);

CREATE TABLE IF NOT EXISTS scraping_history (
    page INTEGER NOT NULL
);

INSERT INTO scraping_history (page) VALUES (0);

-- Down
DROP INDEX IF EXISTS idx_submission_date_submitted;
DROP TABLE IF EXISTS submission;
DROP TABLE IF EXISTS scraping_history;
