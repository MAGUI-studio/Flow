CREATE TABLE schedule_blocks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), establishment_id uuid NOT NULL REFERENCES establishments(id),
 professional_ids uuid[] NOT NULL DEFAULT '{}', starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 reason text NOT NULL, CHECK(ends_at>starts_at)
);
CREATE INDEX schedule_blocks_establishment_id_starts_at_idx ON schedule_blocks(establishment_id,starts_at);
CREATE TABLE customer_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), establishment_id uuid NOT NULL REFERENCES establishments(id),
 consumer_id text NOT NULL REFERENCES accounts(id), content text NOT NULL CHECK(length(content) BETWEEN 1 AND 5000),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_notes_establishment_id_consumer_id_idx ON customer_notes(establishment_id,consumer_id);
CREATE TABLE booking_series (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), establishment_id uuid NOT NULL REFERENCES establishments(id),
 consumer_id text NOT NULL REFERENCES accounts(id), service_id uuid NOT NULL REFERENCES services(id), professional_id uuid NOT NULL REFERENCES professionals(id),
 interval_weeks integer NOT NULL CHECK(interval_weeks IN(1,2)), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_series_establishment_id_created_at_idx ON booking_series(establishment_id,created_at);
ALTER TABLE bookings ADD COLUMN purpose text NOT NULL DEFAULT 'normal' CHECK(purpose IN('normal','reschedule','waitlist'));
ALTER TABLE bookings ADD COLUMN series_id uuid REFERENCES booking_series(id);
CREATE TABLE reschedule_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES bookings(id),
 target_booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','declined','expired','canceled')),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reschedule_requests_booking_id_status_idx ON reschedule_requests(booking_id,status);
CREATE UNIQUE INDEX reschedule_one_pending ON reschedule_requests(booking_id) WHERE status='pending';
CREATE TABLE waitlist_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), consumer_id text NOT NULL REFERENCES accounts(id), service_id uuid NOT NULL REFERENCES services(id),
 professional_id uuid REFERENCES professionals(id), from_date text NOT NULL, to_date text NOT NULL, from_time text NOT NULL, to_time text NOT NULL,
 weekdays integer[] NOT NULL, phone text NOT NULL, status text NOT NULL DEFAULT 'waiting' CHECK(status IN('waiting','offered','booked','canceled','expired')),
 offered_booking_id uuid UNIQUE REFERENCES bookings(id), offer_expires_at timestamptz, attempted_slots text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(from_date<=to_date), CHECK(from_time<to_time)
);
CREATE INDEX waitlist_entries_service_id_status_created_at_idx ON waitlist_entries(service_id,status,created_at);
CREATE INDEX waitlist_entries_consumer_id_status_idx ON waitlist_entries(consumer_id,status);
CREATE UNIQUE INDEX waitlist_one_active ON waitlist_entries(consumer_id,service_id,coalesce(professional_id,'00000000-0000-0000-0000-000000000000'::uuid)) WHERE status IN('waiting','offered');

-- The same establishment lock serializes blocks, reservations and all new workflows.
CREATE FUNCTION enforce_schedule_block() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s sessions%ROWTYPE;
BEGIN
 IF NEW.status NOT IN('confirmed','pending') THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.status=OLD.status AND NEW.session_id=OLD.session_id THEN RETURN NEW; END IF;
 SELECT * INTO s FROM sessions WHERE id=NEW.session_id;
 PERFORM 1 FROM establishments WHERE id=s.establishment_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM schedule_blocks b WHERE b.establishment_id=s.establishment_id
 AND (cardinality(b.professional_ids)=0 OR s.professional_id=ANY(b.professional_ids))
 AND tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(s.occupied_start,s.occupied_end,'[)')) THEN RAISE EXCEPTION 'SCHEDULE_BLOCKED'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER booking_schedule_block BEFORE INSERT OR UPDATE OF status,session_id ON bookings FOR EACH ROW EXECUTE FUNCTION enforce_schedule_block();

-- Workflows publish a single meaningful message rather than intermediate hold/status changes.
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('notify_booking_change()'::regprocedure) INTO definition;
 EXECUTE replace(definition, 'BEGIN', E'BEGIN\n IF current_setting(''flow.silent_notifications'',true)=''on'' THEN RETURN NEW; END IF;');
END $migration$;
