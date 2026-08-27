-- Clean RLS for admin + client roles only (remove data-entry policies / unused drivers table).

-- Remove unused standalone drivers table (drivers = registered client profiles + driver_name on fuel_expenses)
DROP POLICY IF EXISTS "admin_drivers_full" ON public.drivers;
DROP POLICY IF EXISTS "data_entry_drivers_read" ON public.drivers;
DROP TABLE IF EXISTS public.drivers;

-- Drop overlapping / data-entry policies from prior migration attempts
DROP POLICY IF EXISTS "profile_owner_read" ON public.profiles;
DROP POLICY IF EXISTS "admin_vehicles_full" ON public.vehicles;
DROP POLICY IF EXISTS "data_entry_vehicles_read" ON public.vehicles;
DROP POLICY IF EXISTS "admin_fuel_full" ON public.fuel_expenses;
DROP POLICY IF EXISTS "data_entry_fuel_select" ON public.fuel_expenses;
DROP POLICY IF EXISTS "data_entry_fuel_insert" ON public.fuel_expenses;
DROP POLICY IF EXISTS "data_entry_fuel_update" ON public.fuel_expenses;
DROP POLICY IF EXISTS "data_entry_fuel_delete" ON public.fuel_expenses;

DROP FUNCTION IF EXISTS public.get_user_role();

-- Vehicles: authenticated read; admin write
DROP POLICY IF EXISTS "Authenticated can view vehicles" ON public.vehicles;
CREATE POLICY "Authenticated can view vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
CREATE POLICY "Admins can insert vehicles"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
CREATE POLICY "Admins can update vehicles"
ON public.vehicles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;
CREATE POLICY "Admins can delete vehicles"
ON public.vehicles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Fuel expenses: client own rows; admin all
DROP POLICY IF EXISTS "Clients can view own fuel expenses" ON public.fuel_expenses;
CREATE POLICY "Clients can view own fuel expenses"
ON public.fuel_expenses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all fuel expenses" ON public.fuel_expenses;
CREATE POLICY "Admins can view all fuel expenses"
ON public.fuel_expenses
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Clients can insert own fuel expenses" ON public.fuel_expenses;
CREATE POLICY "Clients can insert own fuel expenses"
ON public.fuel_expenses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_admin());

DROP POLICY IF EXISTS "Clients can update own fuel expenses" ON public.fuel_expenses;
CREATE POLICY "Clients can update own fuel expenses"
ON public.fuel_expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND NOT public.is_admin())
WITH CHECK (auth.uid() = user_id AND NOT public.is_admin());

DROP POLICY IF EXISTS "Admins can delete all fuel expenses" ON public.fuel_expenses;
CREATE POLICY "Admins can delete all fuel expenses"
ON public.fuel_expenses
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Clients can delete own fuel expenses" ON public.fuel_expenses;
CREATE POLICY "Clients can delete own fuel expenses"
ON public.fuel_expenses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
