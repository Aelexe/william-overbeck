-- Up
CREATE TABLE IF NOT EXISTS submission_name (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    first_name TEXT,
    middle_names TEXT,
    last_name TEXT,
    FOREIGN KEY (submission_id) REFERENCES submission(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_submission_name_submission_id ON submission_name(submission_id);

-- Create name table with unique constraint
CREATE TABLE IF NOT EXISTS name (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_name_name ON name(name);

-- Add is_group column to submission table
PRAGMA foreign_keys = OFF;
CREATE TABLE submission_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL UNIQUE,
    document_hash TEXT DEFAULT NULL,
    submitter TEXT NOT NULL,
    is_group BOOLEAN DEFAULT NULL,
    is_downloaded BOOLEAN DEFAULT FALSE,
    submitted_timestamp TIMESTAMP NOT NULL
);

-- Copy data from the old table to the new one
INSERT INTO submission_new 
SELECT id, document_id, document_hash, submitter, NULL, is_downloaded, submitted_timestamp 
FROM submission;

-- Drop the old table
DROP TABLE submission;

-- Rename the new table to submission
ALTER TABLE submission_new RENAME TO submission;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_submission_submitted_timestamp ON submission(submitted_timestamp);
PRAGMA foreign_keys = ON;

-- Down
DROP INDEX IF EXISTS idx_submission_name_submission_id;
DROP TABLE IF EXISTS submission_name;
DROP INDEX IF EXISTS idx_name_name;
DROP TABLE IF EXISTS name;

-- Remove is_group column from submission table
PRAGMA foreign_keys = OFF;
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
