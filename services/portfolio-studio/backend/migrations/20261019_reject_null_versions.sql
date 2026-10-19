-- CHECK accepts SQL NULL unless explicitly constrained to TRUE.
ALTER TABLE public.portfolio_app_states DROP CONSTRAINT state_shape;
ALTER TABLE public.portfolio_app_states ADD CONSTRAINT state_shape CHECK ((jsonb_typeof(state) = 'object' AND state->>'version' = '1' AND jsonb_typeof(state->'rows') = 'array' AND jsonb_typeof(state->'extras') = 'object' AND state ?& ARRAY['version','rows','extras']) IS TRUE);
