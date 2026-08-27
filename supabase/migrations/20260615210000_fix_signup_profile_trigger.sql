-- Fix signup 500: "Database error saving new user"
-- Auth triggers run as supabase_auth_admin; the profile insert must bypass that restriction.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN lower(trim(NEW.email)) = lower('admin@capsoodtours.com') THEN 'admin'
      ELSE 'client'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
