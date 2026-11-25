-- Allow admins to edit any fuel expense submitted by drivers.
-- Additive only: does not change existing rows, columns or any other policy.
-- Rollback: DROP POLICY IF EXISTS "Admins can update all fuel expenses" ON public.fuel_expenses;

DROP POLICY IF EXISTS "Admins can update all fuel expenses" ON public.fuel_expenses;
CREATE POLICY "Admins can update all fuel expenses"
ON public.fuel_expenses
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
