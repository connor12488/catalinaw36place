BEGIN;

CREATE TABLE IF NOT EXISTS qa_entries (
  id BIGSERIAL PRIMARY KEY,
  source_key TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE qa_entries
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE INDEX IF NOT EXISTS idx_qa_entries_active_sort
  ON qa_entries (active, sort_order, id);

CREATE INDEX IF NOT EXISTS idx_qa_entries_tags
  ON qa_entries USING GIN (tags);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qa_entries_source_key
  ON qa_entries (source_key);

CREATE OR REPLACE FUNCTION set_qa_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS qa_entries_set_updated_at ON qa_entries;
CREATE TRIGGER qa_entries_set_updated_at
BEFORE UPDATE ON qa_entries
FOR EACH ROW
EXECUTE FUNCTION set_qa_entries_updated_at();

COMMIT;
