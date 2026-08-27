-- Admin RPC: list registered clients with signup name metadata
CREATE OR REPLACE FUNCTION public.get_registered_clients()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  first_name text,
  last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.created_at,
    NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'first_name', '')), '') AS first_name,
    NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'last_name', '')), '') AS last_name
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'client'
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_registered_clients() TO authenticated;
