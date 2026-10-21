ALTER TABLE waitlist_entries ADD COLUMN checked_at timestamptz, ADD COLUMN search_from_date text;
CREATE INDEX waitlist_processing_queue ON waitlist_entries(status,checked_at,created_at);
CREATE INDEX bookings_series_id ON bookings(series_id) WHERE series_id IS NOT NULL;
