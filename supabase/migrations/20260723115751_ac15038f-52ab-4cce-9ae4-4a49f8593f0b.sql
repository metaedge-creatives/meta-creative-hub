
CREATE TABLE public.service_requests_sync (
  id text PRIMARY KEY,
  client_email text,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.service_requests_sync TO service_role;
ALTER TABLE public.service_requests_sync ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: all access via service-role server functions.
