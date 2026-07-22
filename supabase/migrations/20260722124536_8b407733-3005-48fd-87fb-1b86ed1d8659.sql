
CREATE TABLE public.client_users_sync (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_users_sync_email ON public.client_users_sync (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_users_sync TO anon, authenticated;
GRANT ALL ON public.client_users_sync TO service_role;

ALTER TABLE public.client_users_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read client users sync"
  ON public.client_users_sync FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert client users sync"
  ON public.client_users_sync FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update client users sync"
  ON public.client_users_sync FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete client users sync"
  ON public.client_users_sync FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION public.touch_client_users_sync()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_client_users_sync_updated
BEFORE UPDATE ON public.client_users_sync
FOR EACH ROW EXECUTE FUNCTION public.touch_client_users_sync();
