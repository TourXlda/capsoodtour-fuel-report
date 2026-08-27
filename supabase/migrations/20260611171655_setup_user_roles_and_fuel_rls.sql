-- Profiles (roles) + RLS for profiles, vehicles, fuel_expenses

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text check (role in ('client', 'admin')) default 'client',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.fuel_expenses enable row level security;

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

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- Signup → profile as client
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'client');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vehicles: all authenticated can read; only admin can write
drop policy if exists "Authenticated can view vehicles" on public.vehicles;
create policy "Authenticated can view vehicles"
on public.vehicles
for select
to authenticated
using (true);

drop policy if exists "Admins can insert vehicles" on public.vehicles;
create policy "Admins can insert vehicles"
on public.vehicles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update vehicles" on public.vehicles;
create policy "Admins can update vehicles"
on public.vehicles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete vehicles" on public.vehicles;
create policy "Admins can delete vehicles"
on public.vehicles
for delete
to authenticated
using (public.is_admin());

-- Fuel expenses: client own rows; admin all
drop policy if exists "Clients can view own fuel expenses" on public.fuel_expenses;
create policy "Clients can view own fuel expenses"
on public.fuel_expenses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all fuel expenses" on public.fuel_expenses;
create policy "Admins can view all fuel expenses"
on public.fuel_expenses
for select
to authenticated
using (public.is_admin());

drop policy if exists "Clients can insert own fuel expenses" on public.fuel_expenses;
create policy "Clients can insert own fuel expenses"
on public.fuel_expenses
for insert
to authenticated
with check (auth.uid() = user_id and not public.is_admin());

drop policy if exists "Clients can update own fuel expenses" on public.fuel_expenses;
create policy "Clients can update own fuel expenses"
on public.fuel_expenses
for update
to authenticated
using (auth.uid() = user_id and not public.is_admin())
with check (auth.uid() = user_id and not public.is_admin());
