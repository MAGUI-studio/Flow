ALTER TABLE subscriptions ADD COLUMN provider text NOT NULL DEFAULT 'stripe', ADD COLUMN current_period_start timestamptz NOT NULL DEFAULT now(), ADD COLUMN cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE establishments ADD COLUMN category text NOT NULL DEFAULT 'Outros', ADD COLUMN contact_phone text, ADD COLUMN color text NOT NULL DEFAULT '#e5dff0';
