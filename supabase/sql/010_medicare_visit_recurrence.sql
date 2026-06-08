alter table public.visits
  add column if not exists recurrence_type text not null default 'once',
  add column if not exists recurrence_group_id uuid,
  add column if not exists weekly_days integer[] not null default '{}',
  add column if not exists monthly_day integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'visits_recurrence_type_check'
  ) then
    alter table public.visits
      add constraint visits_recurrence_type_check
      check (recurrence_type in ('once', 'daily', 'weekly', 'monthly'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'visits_monthly_day_check'
  ) then
    alter table public.visits
      add constraint visits_monthly_day_check
      check (monthly_day is null or (monthly_day >= 1 and monthly_day <= 31));
  end if;
end $$;

create index if not exists visits_patient_date_time_idx
  on public.visits (patient_id, visit_date, visit_time);

create index if not exists visits_recurrence_group_id_idx
  on public.visits (recurrence_group_id)
  where recurrence_group_id is not null;

update public.visits
set recurrence_type = 'once',
    weekly_days = '{}'
where recurrence_type is null;
