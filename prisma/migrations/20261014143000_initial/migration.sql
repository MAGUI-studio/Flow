-- Initial schema proposal. Apply to a reviewed PostgreSQL development database.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE accounts(id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE subscriptions(owner_id text PRIMARY KEY REFERENCES accounts(id), stripe_customer_id text UNIQUE, stripe_subscription_id text UNIQUE, plan text NOT NULL CHECK(plan IN ('basic','multi')), status text NOT NULL, paid_until timestamptz NOT NULL);
CREATE TABLE establishments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id text NOT NULL REFERENCES accounts(id), slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), name text NOT NULL, timezone text NOT NULL DEFAULT 'America/Sao_Paulo', active boolean NOT NULL DEFAULT true, approval_mode text NOT NULL DEFAULT 'automatic' CHECK(approval_mode IN ('automatic','manual')), cancel_notice_hours integer NOT NULL DEFAULT 2 CHECK(cancel_notice_hours>=0), city text, address text, description text, logo_url text, cover_url text, UNIQUE(id,owner_id));
CREATE TABLE professionals(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), establishment_id uuid NOT NULL REFERENCES establishments(id), name text NOT NULL, active boolean NOT NULL DEFAULT true, UNIQUE(id,establishment_id));
CREATE TABLE services(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), establishment_id uuid NOT NULL REFERENCES establishments(id), name text NOT NULL, duration_minutes integer NOT NULL CHECK(duration_minutes>0), step_minutes integer NOT NULL DEFAULT 30 CHECK(step_minutes>0), buffer_before integer NOT NULL DEFAULT 0 CHECK(buffer_before>=0), buffer_after integer NOT NULL DEFAULT 0 CHECK(buffer_after>=0), price_cents integer NOT NULL CHECK(price_cents>=0), modality text NOT NULL CHECK(modality IN ('online','in_person')), kind text NOT NULL CHECK(kind IN ('individual','collective')), active boolean NOT NULL DEFAULT true, UNIQUE(id,establishment_id));
CREATE TABLE professional_services(establishment_id uuid NOT NULL REFERENCES establishments(id), professional_id uuid NOT NULL, service_id uuid NOT NULL, PRIMARY KEY(professional_id,service_id), FOREIGN KEY(professional_id,establishment_id) REFERENCES professionals(id,establishment_id), FOREIGN KEY(service_id,establishment_id) REFERENCES services(id,establishment_id));
CREATE TABLE availability_windows(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), professional_id uuid NOT NULL REFERENCES professionals(id), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at));
CREATE TABLE professional_blocks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), professional_id uuid NOT NULL REFERENCES professionals(id), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at), reason text);
CREATE TABLE sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), establishment_id uuid NOT NULL REFERENCES establishments(id), professional_id uuid NOT NULL, service_id uuid NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at), occupied_start timestamptz NOT NULL, occupied_end timestamptz NOT NULL, capacity integer NOT NULL CHECK(capacity>0), active boolean NOT NULL DEFAULT true, CHECK(occupied_start<=starts_at AND occupied_end>=ends_at), FOREIGN KEY(professional_id,service_id) REFERENCES professional_services(professional_id,service_id), FOREIGN KEY(professional_id,establishment_id) REFERENCES professionals(id,establishment_id), FOREIGN KEY(service_id,establishment_id) REFERENCES services(id,establishment_id), EXCLUDE USING gist(professional_id WITH =,tstzrange(occupied_start,occupied_end,'[)') WITH &&) WHERE(active));
CREATE TABLE bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES sessions(id), consumer_id text NOT NULL REFERENCES accounts(id), status text NOT NULL CHECK(status IN ('pending','confirmed','declined','canceled','expired','completed','no_show')), price_cents integer NOT NULL CHECK(price_cents>=0), duration_minutes integer NOT NULL CHECK(duration_minutes>0), whatsapp text, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, attendance_hash text, attendance_at timestamptz, idempotency_key uuid NOT NULL, UNIQUE(consumer_id,idempotency_key), CHECK((status='pending' AND expires_at IS NOT NULL) OR status<>'pending'));
CREATE UNIQUE INDEX one_active_booking_per_consumer_session ON bookings(session_id,consumer_id) WHERE status IN ('pending','confirmed');
CREATE INDEX booking_expiration ON bookings(expires_at) WHERE status='pending';
CREATE INDEX establishment_owner ON establishments(owner_id);
CREATE TABLE audit_events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id text REFERENCES accounts(id), establishment_id uuid REFERENCES establishments(id), booking_id uuid REFERENCES bookings(id), action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE stripe_events(id text PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now());

-- All booking mutations must use this lock order (establishment, professional,
-- session). API role must not allow callers to bypass this service contract.
CREATE FUNCTION reserve_session(p_session uuid,p_consumer text,p_whatsapp text,p_key uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE s sessions%ROWTYPE; e establishments%ROWTYPE; v services%ROWTYPE; previous bookings%ROWTYPE; result uuid; v_now timestamptz;
BEGIN
 SELECT * INTO s FROM sessions WHERE id=p_session;
 IF NOT FOUND THEN RAISE EXCEPTION 'SESSION_NOT_FOUND'; END IF;
 SELECT * INTO e FROM establishments WHERE id=s.establishment_id FOR UPDATE;
 PERFORM 1 FROM professionals WHERE id=s.professional_id AND active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PROFESSIONAL_UNAVAILABLE'; END IF;
 SELECT * INTO s FROM sessions WHERE id=p_session FOR UPDATE;
 v_now:=clock_timestamp();
 SELECT * INTO previous FROM bookings WHERE consumer_id=p_consumer AND idempotency_key=p_key;
 IF FOUND THEN
   IF previous.session_id<>p_session THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
   RETURN previous.id;
 END IF;
 IF NOT e.active OR NOT EXISTS(SELECT 1 FROM subscriptions WHERE owner_id=e.owner_id AND status='active' AND paid_until>v_now) THEN RAISE EXCEPTION 'ESTABLISHMENT_FROZEN'; END IF;
 IF NOT s.active OR s.starts_at<=v_now THEN RAISE EXCEPTION 'SESSION_UNAVAILABLE'; END IF;
 SELECT * INTO v FROM services WHERE id=s.service_id AND active;
 IF NOT FOUND THEN RAISE EXCEPTION 'SERVICE_UNAVAILABLE'; END IF;
 IF v.kind='individual' AND s.capacity<>1 THEN RAISE EXCEPTION 'INVALID_CAPACITY'; END IF;
 IF v.modality='online' AND (p_whatsapp IS NULL OR p_whatsapp !~ '^\+[1-9][0-9]{7,14}$') THEN RAISE EXCEPTION 'WHATSAPP_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM availability_windows WHERE professional_id=s.professional_id AND starts_at<=s.occupied_start AND ends_at>=s.occupied_end) OR EXISTS(SELECT 1 FROM professional_blocks WHERE professional_id=s.professional_id AND tstzrange(starts_at,ends_at,'[)') && tstzrange(s.occupied_start,s.occupied_end,'[)')) THEN RAISE EXCEPTION 'OUTSIDE_AVAILABILITY'; END IF;
 UPDATE bookings SET status='expired' WHERE session_id=s.id AND status='pending' AND expires_at<=v_now;
 IF (SELECT count(*) FROM bookings WHERE session_id=s.id AND status IN ('pending','confirmed'))>=s.capacity THEN RAISE EXCEPTION 'SESSION_FULL'; END IF;
 INSERT INTO bookings(session_id,consumer_id,status,price_cents,duration_minutes,whatsapp,expires_at,idempotency_key)
 VALUES(s.id,p_consumer,CASE WHEN e.approval_mode='manual' THEN 'pending' ELSE 'confirmed' END,v.price_cents,v.duration_minutes,p_whatsapp,CASE WHEN e.approval_mode='manual' THEN least(v_now+interval '24 hours',s.starts_at) ELSE NULL END,p_key) RETURNING id INTO result;
 INSERT INTO audit_events(actor_id,establishment_id,booking_id,action) VALUES(p_consumer,e.id,result,'booking.created');
 RETURN result;
END; $$;
COMMIT;
