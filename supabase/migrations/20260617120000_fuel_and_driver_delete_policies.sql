-- Delete policies for fuel expenses + admin delete driver RPC

drop policy if exists "Admins can delete all fuel expenses" on public.fuel_expenses;
create policy "Admins can delete all fuel expenses"
on public.fuel_expenses
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Clients can delete own fuel expenses" on public.fuel_expenses;
create policy "Clients can delete own fuel expenses"
on public.fuel_expenses
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.admin_delete_client(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = target_user_id and role = 'client'
  ) then
    raise exception 'User not found or not a client';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_client(uuid) to authenticated;
