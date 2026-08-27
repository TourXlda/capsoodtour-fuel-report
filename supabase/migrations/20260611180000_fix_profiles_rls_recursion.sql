-- Fix infinite RLS recursion on profiles

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all fuel expenses" on public.fuel_expenses;
create policy "Admins can view all fuel expenses"
on public.fuel_expenses
for select
to authenticated
using (public.is_admin());

-- Backfill profiles for users created directly in Supabase dashboard
insert into public.profiles (id, email, role)
select u.id, u.email, 'client'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;
