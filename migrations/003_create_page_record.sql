-- Up
CREATE TABLE IF NOT EXISTS page_record (
    page_number INTEGER PRIMARY KEY,
    is_scraped BOOLEAN DEFAULT FALSE
);

-- Insert records for pages from 1 to the current max page in scraping_history
WITH RECURSIVE numbers(n) AS (
    SELECT 1
    UNION ALL
    SELECT n+1 FROM numbers WHERE n < (SELECT page FROM scraping_history LIMIT 1)
)
INSERT INTO page_record (page_number, is_scraped)
SELECT n, TRUE FROM numbers;

-- After populating the page_record table, drop the scraping_history table
DROP TABLE IF EXISTS scraping_history;

-- Down
DROP TABLE IF EXISTS page_record;
-- Recreate the scraping_history table
CREATE TABLE IF NOT EXISTS scraping_history (
    page INTEGER NOT NULL
);
-- Insert the highest scraped page number
INSERT INTO scraping_history (page) 
SELECT MAX(page_number) FROM page_record WHERE is_scraped = TRUE;
