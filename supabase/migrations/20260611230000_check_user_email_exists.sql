CREATE OR REPLACE FUNCTION public.check_user_email_exists(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(trim(check_email))
  );
$$;

REVOKE ALL ON FUNCTION public.check_user_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_user_email_exists(text) TO anon, authenticated;
