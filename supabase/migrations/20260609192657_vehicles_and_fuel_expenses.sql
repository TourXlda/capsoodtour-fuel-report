-- Capsood Fuel Report — core tables: vehicles + fuel expenses

-- =========================
-- VEHICLES
-- =========================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plate_number text not null,
  fuel_type text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_plate_number_unique unique (plate_number),
  constraint vehicles_fuel_type_check check (
    fuel_type = any (array['petrol', 'diesel', 'cng', 'electric', 'hybrid', 'other'])
  ),
  constraint vehicles_status_check check (
    status = any (array['active', 'inactive', 'maintenance'])
  )
);

create index if not exists vehicles_status_idx on public.vehicles (status);
create index if not exists vehicles_plate_number_idx on public.vehicles (plate_number);

-- =========================
-- FUEL EXPENSES
-- =========================
create table if not exists public.fuel_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  expense_date date not null,
  driver_name text not null,
  odometer_reading numeric(12, 2) not null,
  liters numeric(12, 3) not null,
  price_per_liter numeric(12, 4) not null,
  total_amount numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fuel_expenses_liters_positive check (liters > 0),
  constraint fuel_expenses_price_positive check (price_per_liter >= 0),
  constraint fuel_expenses_total_positive check (total_amount >= 0),
  constraint fuel_expenses_odometer_nonneg check (odometer_reading >= 0)
);

create index if not exists fuel_expenses_user_id_idx on public.fuel_expenses (user_id);
create index if not exists fuel_expenses_vehicle_id_idx on public.fuel_expenses (vehicle_id);
create index if not exists fuel_expenses_expense_date_idx on public.fuel_expenses (expense_date);
create index if not exists fuel_expenses_driver_name_idx on public.fuel_expenses (driver_name);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

drop trigger if exists fuel_expenses_set_updated_at on public.fuel_expenses;
create trigger fuel_expenses_set_updated_at
  before update on public.fuel_expenses
  for each row execute function public.set_updated_at();
