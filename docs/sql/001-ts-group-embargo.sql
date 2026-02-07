-- Migration: Add embargo_hours lookup table for timeseries groups
-- Purpose: Store embargo periods per timeseries group for authorization filtering
-- Date: December 2025

-- Create the embargo lookup table (normalized approach)
-- Note: FK constraint removed because at_sec_ts_groups has composite PK (db_office_code, ts_group_code)
CREATE TABLE cwms_20.at_sec_ts_group_embargo (
    ts_group_code NUMBER NOT NULL,
    embargo_hours NUMBER DEFAULT 168 NOT NULL,
    CONSTRAINT pk_at_sec_ts_group_embargo PRIMARY KEY (ts_group_code)
);

COMMENT ON TABLE cwms_20.at_sec_ts_group_embargo IS
    'Stores embargo periods (in hours) for each timeseries group. Used by authorization proxy.';

COMMENT ON COLUMN cwms_20.at_sec_ts_group_embargo.ts_group_code IS
    'Foreign key to at_sec_ts_groups. Unique per group (global, not per office).';

COMMENT ON COLUMN cwms_20.at_sec_ts_group_embargo.embargo_hours IS
    'Number of hours that data in this group is embargoed. 0 = no embargo.';

-- Insert default embargo values for existing groups
INSERT INTO cwms_20.at_sec_ts_group_embargo (ts_group_code, embargo_hours)
VALUES (0, 0);    -- All TS Ids: No embargo

INSERT INTO cwms_20.at_sec_ts_group_embargo (ts_group_code, embargo_hours)
VALUES (1, 72);   -- All Raw TS Ids: 3 days (72 hours)

INSERT INTO cwms_20.at_sec_ts_group_embargo (ts_group_code, embargo_hours)
VALUES (2, 168);  -- All Rev TS Ids: 7 days (168 hours)

-- Grant permissions to CWMS_20 user
GRANT SELECT ON cwms_20.at_sec_ts_group_embargo TO cwms_20;

COMMIT;
