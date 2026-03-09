-- Migration: Add denormalized filter columns to investment_snapshots
-- These columns are copied from the parent investment row so that timeline
-- queries can GROUP BY or filter by accountType / currency / nrType without
-- a JOIN against the investments table.

-- ── Phase A: Add columns as nullable ──────────────────────────────────────────
ALTER TABLE investment_snapshots
  ADD COLUMN account_type_id integer REFERENCES account_types(id),
  ADD COLUMN currency_id     integer REFERENCES currencies(id),
  ADD COLUMN nr_type         nr_type;

-- ── Phase B: Backfill from parent investments row ─────────────────────────────
UPDATE investment_snapshots s
SET
  account_type_id = i.account_type_id,
  currency_id     = i.currency_id,
  nr_type         = i.nr_type
FROM investments i
WHERE i.id = s.investment_id;

-- ── Phase C: Enforce NOT NULL now that all rows are populated ─────────────────
ALTER TABLE investment_snapshots
  ALTER COLUMN account_type_id SET NOT NULL,
  ALTER COLUMN currency_id     SET NOT NULL,
  ALTER COLUMN nr_type         SET NOT NULL;

-- ── Phase D: Add composite indexes for filtered timeline queries ───────────────
CREATE INDEX snapshots_date_account_type_idx ON investment_snapshots(snapshot_date, account_type_id);
CREATE INDEX snapshots_date_currency_idx     ON investment_snapshots(snapshot_date, currency_id);
CREATE INDEX snapshots_date_nr_type_idx      ON investment_snapshots(snapshot_date, nr_type);
