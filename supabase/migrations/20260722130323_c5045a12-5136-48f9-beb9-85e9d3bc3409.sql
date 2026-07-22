-- Lock down client_users_sync: remove public read/write policies.
-- All access now goes through service-role-backed server functions.
DROP POLICY IF EXISTS "Anyone can delete client users sync" ON public.client_users_sync;
DROP POLICY IF EXISTS "Anyone can update client users sync" ON public.client_users_sync;
DROP POLICY IF EXISTS "Anyone can insert client users sync" ON public.client_users_sync;
DROP POLICY IF EXISTS "Anyone can read client users sync" ON public.client_users_sync;

-- Ensure RLS stays on; with no policies, anon/authenticated get zero access.
ALTER TABLE public.client_users_sync ENABLE ROW LEVEL SECURITY;

-- Revoke direct Data API access from anon/authenticated. Service role bypasses RLS.
REVOKE ALL ON public.client_users_sync FROM anon;
REVOKE ALL ON public.client_users_sync FROM authenticated;
GRANT ALL ON public.client_users_sync TO service_role;