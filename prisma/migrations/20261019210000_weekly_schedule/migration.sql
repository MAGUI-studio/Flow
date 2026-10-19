ALTER TABLE professionals ADD COLUMN weekly_schedule jsonb;

CREATE FUNCTION professional_availability_windows(p_professional uuid, p_from date, p_to date)
RETURNS TABLE(starts_at timestamptz, ends_at timestamptz) LANGUAGE sql STABLE AS $$
  SELECT w.starts_at, w.ends_at
  FROM availability_windows w JOIN professionals p ON p.id=w.professional_id
  WHERE p.id=p_professional AND p.weekly_schedule IS NULL
    AND w.ends_at > p_from::timestamp AT TIME ZONE (SELECT timezone FROM establishments WHERE id=p.establishment_id)
    AND w.starts_at < (p_to+1)::timestamp AT TIME ZONE (SELECT timezone FROM establishments WHERE id=p.establishment_id)
  UNION ALL
  SELECT (d::date + (r->>'start')::time) AT TIME ZONE e.timezone,
         (d::date + (r->>'end')::time) AT TIME ZONE e.timezone
  FROM professionals p JOIN establishments e ON e.id=p.establishment_id
  CROSS JOIN LATERAL jsonb_array_elements(p.weekly_schedule->'days') day_rule
  CROSS JOIN LATERAL jsonb_array_elements(day_rule->'intervals') r
  CROSS JOIN generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
  WHERE p.id=p_professional AND (day_rule->>'enabled')::boolean
    AND (day_rule->>'weekday')::int=extract(dow FROM d)::int;
$$;
CREATE FUNCTION professional_is_available(p_professional uuid, p_start timestamptz, p_end timestamptz)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT p_end > p_start AND EXISTS (
    SELECT 1 FROM professionals p JOIN establishments e ON e.id=p.establishment_id
    CROSS JOIN LATERAL professional_availability_windows(p.id,(p_start AT TIME ZONE e.timezone)::date,(p_end AT TIME ZONE e.timezone)::date) w
    WHERE p.id=p_professional AND w.starts_at<=p_start AND w.ends_at>=p_end
  );
$$;

CREATE OR REPLACE FUNCTION reserve_session(p_session uuid,p_consumer text,p_whatsapp text,p_key uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE s sessions%ROWTYPE; e establishments%ROWTYPE; v services%ROWTYPE; previous bookings%ROWTYPE; result uuid; v_now timestamptz;
BEGIN
 SELECT * INTO s FROM sessions WHERE id=p_session;
 IF NOT FOUND THEN RAISE EXCEPTION 'SESSION_NOT_FOUND'; END IF;
 SELECT * INTO e FROM establishments WHERE id=s.establishment_id FOR UPDATE;
 PERFORM 1 FROM professionals WHERE id=s.professional_id AND active AND deleted_at IS NULL AND NOT (vacation_starts_at IS NOT NULL AND tstzrange(vacation_starts_at,vacation_ends_at,'[)') && tstzrange(s.occupied_start,s.occupied_end,'[)')) FOR UPDATE;
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
 IF NOT professional_is_available(s.professional_id,s.occupied_start,s.occupied_end) OR EXISTS(SELECT 1 FROM professional_blocks WHERE professional_id=s.professional_id AND tstzrange(starts_at,ends_at,'[)') && tstzrange(s.occupied_start,s.occupied_end,'[)')) THEN RAISE EXCEPTION 'OUTSIDE_AVAILABILITY'; END IF;
 UPDATE bookings SET status='expired' WHERE session_id=s.id AND status='pending' AND expires_at<=v_now;
 IF (SELECT count(*) FROM bookings WHERE session_id=s.id AND status IN ('pending','confirmed'))>=s.capacity THEN RAISE EXCEPTION 'SESSION_FULL'; END IF;
 INSERT INTO bookings(session_id,consumer_id,status,price_cents,duration_minutes,whatsapp,expires_at,idempotency_key,created_at)
 VALUES(s.id,p_consumer,CASE WHEN e.approval_mode='manual' THEN 'pending' ELSE 'confirmed' END,v.price_cents,v.duration_minutes,p_whatsapp,CASE WHEN e.approval_mode='manual' THEN least(v_now+interval '24 hours',s.starts_at) ELSE NULL END,p_key,v_now) RETURNING id INTO result;
 INSERT INTO audit_events(actor_id,establishment_id,booking_id,action) VALUES(p_consumer,e.id,result,'booking.created');
 RETURN result;
END; $$;
