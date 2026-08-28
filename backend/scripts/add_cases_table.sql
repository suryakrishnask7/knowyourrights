-- Run this in the Supabase SQL editor to add the cases table for Phase 2.
-- The cases table stores anonymous user sessions for cross-refresh persistence.
--
-- CRITICAL: case_id is NEVER part of the response_cache key.
-- The cache key is always (category, jurisdiction, missing_facts_signature).
-- Two different anonymous cases asking the same legal question share one cache entry.

CREATE TABLE IF NOT EXISTS cases (
  case_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at           TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  status               TEXT        NOT NULL DEFAULT 'processing'
                         CHECK (status IN ('processing', 'awaiting_clarification', 'resolved', 'expired')),
  category             TEXT,
  jurisdiction         TEXT,
  original_query       TEXT        NOT NULL,
  facts                JSONB       NOT NULL DEFAULT '{}',
  clarification_round  INT         NOT NULL DEFAULT 0,
  asked_facts          JSONB       NOT NULL DEFAULT '[]',
  -- Full result payload stored on resolve so a refresh restores without rerunning the pipeline
  result               JSONB
);

CREATE INDEX IF NOT EXISTS cases_status_idx      ON cases (status);
CREATE INDEX IF NOT EXISTS cases_expires_at_idx  ON cases (expires_at);
