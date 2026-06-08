alter table public.medications
  add column if not exists purpose text not null default '',
  add column if not exists frequency_type text not null default 'daily',
  add column if not exists interval_hours integer,
  add column if not exists weekly_days integer[] not null default '{}',
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_email text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'medications_frequency_type_check'
  ) then
    alter table public.medications
      add constraint medications_frequency_type_check
      check (frequency_type in ('daily', 'weekly', 'interval'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'medications_interval_hours_check'
  ) then
    alter table public.medications
      add constraint medications_interval_hours_check
      check (interval_hours is null or interval_hours in (8, 12, 24));
  end if;
end $$;

alter table public.medication_intakes
  add column if not exists scheduled_time time;

update public.medication_intakes mi
set scheduled_time = m.time
from public.medications m
where mi.medication_id = m.id
  and mi.scheduled_time is null;

alter table public.medication_intakes
  alter column scheduled_time set not null;

alter table public.medication_intakes
  drop constraint if exists medication_intakes_medication_id_scheduled_date_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'medication_intakes_medication_id_scheduled_date_scheduled_time_key'
  ) then
    alter table public.medication_intakes
      add constraint medication_intakes_medication_id_scheduled_date_scheduled_time_key
      unique (medication_id, scheduled_date, scheduled_time);
  end if;
end $$;

update public.medications
set
  purpose = case name
    when 'Losartan' then 'Control de presion arterial.'
    when 'Metformina' then 'Control de glucemia.'
    when 'Atorvastatina' then 'Control de colesterol.'
    when 'Vitamina D' then 'Suplemento indicado para salud osea.'
    else coalesce(nullif(purpose, ''), 'Medicacion indicada por el equipo de cuidado.')
  end,
  frequency_type = 'daily',
  interval_hours = 24,
  weekly_days = '{}',
  reminder_enabled = name in ('Metformina'),
  reminder_email = case when name in ('Metformina') then 'familiar@medicare.demo' else '' end
where patient_id = '11111111-1111-4111-8111-111111111111';
