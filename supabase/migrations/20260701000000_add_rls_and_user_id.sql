-- Ensure fuel_expenses.user_id defaults to the authenticated user on insert.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fuel_expenses'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.fuel_expenses
      ADD COLUMN user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;
END $$;

ALTER TABLE public.fuel_expenses
  ALTER COLUMN user_id SET DEFAULT auth.uid();
