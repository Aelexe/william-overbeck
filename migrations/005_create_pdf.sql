-- Up
CREATE TABLE IF NOT EXISTS pdf (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL UNIQUE,
    content TEXT NOT NULL,
    size INTEGER NOT NULL,
    image_count INTEGER NOT NULL,
    FOREIGN KEY (submission_id) REFERENCES submission(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pdf_submission_id ON pdf(submission_id);

-- Remove content column by recreating the table without it
PRAGMA foreign_keys = OFF;

-- Create a new table without the content column
CREATE TABLE submission_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL UNIQUE,
    document_hash TEXT DEFAULT NULL,
    submitter TEXT NOT NULL,
    is_downloaded BOOLEAN DEFAULT FALSE,
    submitted_timestamp TIMESTAMP NOT NULL
);

-- Copy data from the old table to the new one
INSERT INTO submission_new 
SELECT id, document_id, document_hash, submitter, is_downloaded, submitted_timestamp 
FROM submission;

-- Drop the old table
DROP TABLE submission;

-- Rename the new table to submission
ALTER TABLE submission_new RENAME TO submission;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_submission_submitted_timestamp ON submission(submitted_timestamp);

PRAGMA foreign_keys = ON;

-- Down
-- Add content column back to submission table
PRAGMA foreign_keys = OFF;

CREATE TABLE submission_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL UNIQUE,
    document_hash TEXT DEFAULT NULL,
    submitter TEXT NOT NULL,
    is_downloaded BOOLEAN DEFAULT FALSE,
    content TEXT DEFAULT NULL,
    submitted_timestamp TIMESTAMP NOT NULL
);

-- Copy data from the current table and join with pdf to get content
INSERT INTO submission_new 
SELECT s.id, s.document_id, s.document_hash, s.submitter, s.is_downloaded, p.content, s.submitted_timestamp
FROM submission s
LEFT JOIN pdf p ON s.id = p.submission_id;

-- Drop the old table
DROP TABLE submission;

-- Rename the new table to submission
ALTER TABLE submission_new RENAME TO submission;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_submission_submitted_timestamp ON submission(submitted_timestamp);

PRAGMA foreign_keys = ON;

DROP INDEX IF EXISTS idx_pdf_submission_id;
DROP TABLE IF EXISTS pdf;
