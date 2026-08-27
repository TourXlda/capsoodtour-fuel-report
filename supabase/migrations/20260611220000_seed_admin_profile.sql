-- Add display_name column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text;

-- Create/update function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    display_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'admin@capsoodfuelreport.com' THEN 'admin'
      ELSE 'client'
    END,
    CASE
      WHEN NEW.email = 'admin@capsoodfuelreport.com' THEN 'Admin'
      ELSE split_part(NEW.email, '@', 1)
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


  