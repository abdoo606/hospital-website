-- Administrative, transactional test; creates no persistent users or data.
BEGIN;
CREATE TEMP TABLE portfolio_all_apps_test AS SELECT gen_random_uuid() AS user_id;
INSERT INTO auth.users(id,aud,role,email) SELECT user_id,'authenticated','authenticated',user_id::text || '@example.invalid' FROM portfolio_all_apps_test;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM portfolio_all_apps_test),true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE app text; BEGIN
  BEGIN
    PERFORM public.portfolio_save_state('ledger','{"version":null,"rows":[],"extras":{}}'::jsonb,0);
    RAISE EXCEPTION 'FAIL: null version accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  FOREACH app IN ARRAY ARRAY['ledger','stockroom','momentum','daylight','gather','balance','resolve','ritual','fieldwork','northstar'] LOOP
    PERFORM public.portfolio_save_state(app,'{"version":1,"rows":[],"extras":{}}'::jsonb,0);
  END LOOP;
  IF (SELECT count(*) FROM public.portfolio_app_states) <> 10 THEN RAISE EXCEPTION 'FAIL: expected ten isolated application workspaces'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: null-version rejected and all ten application identifiers stored successfully in rolled-back test' AS result, (SELECT count(*) FROM public.portfolio_app_states) AS persisted_workspaces_after_tests, (SELECT count(*) FROM auth.users) AS persisted_users_after_tests;
