-- Run only with administrative SQL privileges on an isolated/test database.
-- Synthetic auth fixtures and records are rolled back; no emails are sent.
BEGIN;
CREATE TEMP TABLE portfolio_test_ids AS SELECT gen_random_uuid() AS user_a, gen_random_uuid() AS user_b;
GRANT SELECT ON portfolio_test_ids TO authenticated;
INSERT INTO auth.users (id, aud, role, email) SELECT user_a, 'authenticated', 'authenticated', user_a::text || '@example.invalid' FROM portfolio_test_ids UNION ALL SELECT user_b, 'authenticated', 'authenticated', user_b::text || '@example.invalid' FROM portfolio_test_ids;
SELECT set_config('request.jwt.claim.sub',(SELECT user_a::text FROM portfolio_test_ids),true);
SET LOCAL ROLE authenticated;
SELECT revision AS first_revision FROM public.portfolio_save_state('ledger','{"version":1,"rows":[],"extras":{}}'::jsonb,0);
SELECT revision AS second_revision FROM public.portfolio_save_state('ledger','{"version":1,"rows":[],"extras":{"test":true}}'::jsonb,1);
DO $$ BEGIN
  BEGIN PERFORM public.portfolio_save_state('ledger','{"version":1,"rows":[],"extras":{}}'::jsonb,1); RAISE EXCEPTION 'FAIL: stale update accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN PERFORM public.portfolio_save_state('not-an-app','{"version":1,"rows":[],"extras":{}}'::jsonb,0); RAISE EXCEPTION 'FAIL: unknown app accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN PERFORM public.portfolio_save_state('gather','{"version":1}'::jsonb,0); RAISE EXCEPTION 'FAIL: malformed state accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
  IF (SELECT count(*) FROM public.portfolio_app_states) <> 1 THEN RAISE EXCEPTION 'FAIL: owner cannot read own workspace'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT user_b::text FROM portfolio_test_ids),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.portfolio_app_states) <> 0 THEN RAISE EXCEPTION 'FAIL: cross-user read'; END IF;
  BEGIN PERFORM public.portfolio_save_state('ledger','{"version":1,"rows":[],"extras":{}}'::jsonb,2); RAISE EXCEPTION 'FAIL: cross-user update'; EXCEPTION WHEN serialization_failure THEN NULL; END;
END $$;
SELECT revision AS isolated_user_revision FROM public.portfolio_save_state('ledger','{"version":1,"rows":[],"extras":{}}'::jsonb,0);
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM 1 FROM public.portfolio_app_states; RAISE EXCEPTION 'FAIL: anon read'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.portfolio_save_state('ledger','{"version":1,"rows":[],"extras":{}}'::jsonb,0); RAISE EXCEPTION 'FAIL: anon save'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'PASS: owner isolation, concurrent revision guard, shape checks, anonymous denial. All synthetic records rolled back.' AS result;
ROLLBACK;
