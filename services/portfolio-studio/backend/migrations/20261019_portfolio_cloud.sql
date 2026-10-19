-- Applied to the dedicated portfolio-studio project, not existing user projects.
CREATE TABLE public.portfolio_app_states (
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id text NOT NULL CHECK (app_id IN ('ledger','stockroom','momentum','daylight','gather','balance','resolve','ritual','fieldwork','northstar')),
  state jsonb NOT NULL,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, app_id),
  CONSTRAINT state_shape CHECK (jsonb_typeof(state) = 'object' AND state->>'version' = '1' AND jsonb_typeof(state->'rows') = 'array' AND jsonb_typeof(state->'extras') = 'object' AND state ?& ARRAY['version','rows','extras']),
  CONSTRAINT state_size CHECK (octet_length(state::text) <= 1048576),
  CONSTRAINT row_limit CHECK (jsonb_array_length(state->'rows') <= 5000)
);
ALTER TABLE public.portfolio_app_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_app_states FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.portfolio_app_states FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.portfolio_app_states TO authenticated;
CREATE POLICY own_workspace_read ON public.portfolio_app_states FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
CREATE FUNCTION public.portfolio_save_state(p_app text, p_state jsonb, p_expected_revision bigint)
RETURNS public.portfolio_app_states
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid := auth.uid(); result public.portfolio_app_states;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  IF p_expected_revision IS NULL OR p_expected_revision < 0 THEN RAISE EXCEPTION 'Invalid revision' USING ERRCODE = '22023'; END IF;
  IF p_expected_revision = 0 THEN
    INSERT INTO public.portfolio_app_states (owner_id, app_id, state) VALUES (uid, p_app, p_state)
    ON CONFLICT (owner_id, app_id) DO NOTHING RETURNING * INTO result;
  ELSE
    UPDATE public.portfolio_app_states SET state = p_state, revision = revision + 1, updated_at = now()
    WHERE owner_id = uid AND app_id = p_app AND revision = p_expected_revision RETURNING * INTO result;
  END IF;
  IF result.owner_id IS NULL THEN RAISE EXCEPTION 'Workspace changed on another device. Reload before saving.' USING ERRCODE = '40001'; END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.portfolio_save_state(text,jsonb,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.portfolio_save_state(text,jsonb,bigint) TO authenticated;
COMMENT ON TABLE public.portfolio_app_states IS 'Per-user, per-application JSON snapshots for ten portfolio prototypes; not a production normalized business schema.';
