ALTER TABLE establishments ADD COLUMN published boolean NOT NULL DEFAULT true;
ALTER TABLE bookings ADD COLUMN completed_automatically boolean NOT NULL DEFAULT false;
UPDATE bookings b SET completed_automatically=true WHERE EXISTS (SELECT 1 FROM audit_events a WHERE a.booking_id=b.id AND a.action='booking.auto_completed');
CREATE TABLE notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 event_key text NOT NULL UNIQUE,
 title text NOT NULL, body text NOT NULL, href text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz
);
CREATE INDEX notifications_account_id_created_at_idx ON notifications(account_id,created_at DESC);
CREATE INDEX notifications_unread_account ON notifications(account_id) WHERE read_at IS NULL;
CREATE FUNCTION notify_booking_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE info record; heading text; details text;
BEGIN
 IF TG_OP='UPDATE' AND NEW.status=OLD.status THEN RETURN NEW; END IF;
 SELECT e.owner_id,e.name business,s.establishment_id,v.name service,p.name professional,s.starts_at,e.timezone
 INTO info FROM sessions s JOIN establishments e ON e.id=s.establishment_id
 JOIN services v ON v.id=s.service_id JOIN professionals p ON p.id=s.professional_id WHERE s.id=NEW.session_id;
 heading := CASE NEW.status WHEN 'pending' THEN 'Aguardando aprovação' WHEN 'confirmed' THEN 'Agendamento confirmado' WHEN 'canceled' THEN 'Agendamento cancelado' WHEN 'declined' THEN 'Solicitação não aprovada' WHEN 'expired' THEN 'Solicitação expirada' WHEN 'completed' THEN 'Seu atendimento já pode ser avaliado' WHEN 'no_show' THEN 'Ausência registrada' ELSE NULL END;
 IF heading IS NULL THEN RETURN NEW; END IF;
 details := info.service || ' em ' || info.business || ' · ' || to_char(info.starts_at AT TIME ZONE info.timezone,'DD/MM às HH24:MI');
 IF NEW.status='pending' THEN details:=details||'. Aguarde a resposta até '||to_char(NEW.expires_at AT TIME ZONE info.timezone,'DD/MM às HH24:MI')||'. Sem aprovação, a solicitação expira.'; END IF;
 IF NEW.status='completed' AND NEW.completed_automatically THEN details:=details||'. Concluído automaticamente após 24 horas.'; END IF;
 INSERT INTO notifications(account_id,event_key,title,body,href) VALUES(NEW.consumer_id,'booking:'||NEW.id||':'||NEW.status||':consumer',heading,details,'/agendamentos?periodo=all') ON CONFLICT(event_key) DO NOTHING;
 IF info.owner_id<>NEW.consumer_id THEN
 INSERT INTO notifications(account_id,event_key,title,body,href) VALUES(info.owner_id,'booking:'||NEW.id||':'||NEW.status||':owner',CASE WHEN NEW.status='pending' THEN 'Uma reserva precisa da sua aprovação' WHEN TG_OP='INSERT' THEN 'Novo agendamento' WHEN NEW.status='completed' THEN 'Atendimento concluído' ELSE heading END,details,'/painel/agenda?estabelecimento='||info.establishment_id||'&periodo=all') ON CONFLICT(event_key) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER booking_notifications AFTER INSERT OR UPDATE OF status ON bookings FOR EACH ROW EXECUTE FUNCTION notify_booking_change();
