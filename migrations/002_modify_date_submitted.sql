-- Up
CREATE TABLE submission_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL UNIQUE,
    document_hash TEXT DEFAULT NULL,
    submitter TEXT NOT NULL,
    is_downloaded BOOLEAN DEFAULT FALSE,
    content TEXT DEFAULT NULL,
    submitted_timestamp TIMESTAMP NOT NULL
);

INSERT INTO submission_temp SELECT 
    id, document_id, document_hash, submitter, is_downloaded, content, date_submitted AS submitted_timestamp 
FROM submission;
DROP TABLE submission;
ALTER TABLE submission_temp RENAME TO submission;
CREATE INDEX IF NOT EXISTS idx_submission_submitted_timestamp ON submission(submitted_timestamp);

-- Down
CREATE TABLE submission_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL UNIQUE,
    document_hash TEXT DEFAULT NULL,
    submitter TEXT NOT NULL,
    is_downloaded BOOLEAN DEFAULT FALSE,
    content TEXT DEFAULT NULL,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO submission_temp SELECT 
    id, document_id, document_hash, submitter, is_downloaded, content, submitted_timestamp AS date_submitted 
FROM submission;
DROP TABLE submission;
ALTER TABLE submission_temp RENAME TO submission;
CREATE INDEX IF NOT EXISTS idx_submission_date_submitted ON submission(date_submitted);
