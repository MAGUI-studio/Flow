ALTER TABLE establishments ADD COLUMN website TEXT, ADD COLUMN instagram TEXT;
CREATE TABLE favorites (account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(account_id,establishment_id));
CREATE INDEX favorites_establishment_id_idx ON favorites(establishment_id);
CREATE TABLE business_banners (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),owner_id TEXT NOT NULL,url TEXT NOT NULL,key TEXT NOT NULL UNIQUE,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX business_banners_owner_id_created_at_idx ON business_banners(owner_id,created_at);