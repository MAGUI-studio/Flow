DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('notify_booking_change()'::regprocedure) INTO definition;
 EXECUTE replace(definition, 'IF current_setting', E'IF NEW.purpose<>''normal'' THEN RETURN NEW; END IF;\n IF current_setting');
END $migration$;
