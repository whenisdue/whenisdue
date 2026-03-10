-- Enable the trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a normalized search column to Event
ALTER TABLE "Event" ADD COLUMN "titleSearch" TEXT GENERATED ALWAYS AS (
  lower(regexp_replace("title", '[^a-zA-Z0-9]+', '', 'g'))
) STORED;

-- Add a normalized search column to EventSubmission
ALTER TABLE "EventSubmission" ADD COLUMN "titleSearch" TEXT GENERATED ALWAYS AS (
  lower(regexp_replace("submittedTitle", '[^a-zA-Z0-9]+', '', 'g'))
) STORED;

-- Create a GiST index on the Event table for fast "ORDER BY dist LIMIT 3" queries
CREATE INDEX "event_title_search_trgm_idx" ON "Event" USING gist ("titleSearch" gist_trgm_ops);