-- Enforces username uniqueness and modifies the auto-creation trigger logic to resolve name collisions.
ALTER TABLE public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

-- Auto-create public.users row with a unique username on signup
-- Accomplishes auto-creation of a public.users row with a unique username candidate derived from email or metadata.
-- Expected parameters: Triggered AFTER INSERT on auth.users; receives NEW record.
-- Upstream dependencies: Executed automatically on supabase auth signup events.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  candidate text;
  suffix int := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  base_username := lower(regexp_replace(base_username, '[^a-z0-9_]', '', 'g'));
  IF length(base_username) = 0 THEN
    base_username := 'user';
  END IF;
  IF length(base_username) > 40 THEN
    base_username := left(base_username, 40);
  END IF;

  candidate := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  END LOOP;

  INSERT INTO public.users (id, username, map_color)
  VALUES (NEW.id, candidate, '#c0622f')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
