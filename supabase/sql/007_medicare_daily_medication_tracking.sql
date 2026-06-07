create table public.medication_intakes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_date date not null,
  status public.medication_status not null default 'pendiente',
  taken_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (medication_id, scheduled_date)
);

create trigger medication_intakes_set_updated_at
before update on public.medication_intakes
for each row execute function public.set_updated_at();

alter table public.medication_intakes enable row level security;

create index medication_intakes_patient_date_idx on public.medication_intakes(patient_id, scheduled_date);
create index medication_intakes_medication_id_idx on public.medication_intakes(medication_id);

create policy "Members can read medication intakes"
on public.medication_intakes for select
to authenticated
using (app_private.is_patient_member(patient_id));

create policy "Family and doctors can create medication intakes"
on public.medication_intakes for insert
to authenticated
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Family and doctors can update medication intakes"
on public.medication_intakes for update
to authenticated
using (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Demo users can read medication intakes"
on public.medication_intakes for select
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = medication_intakes.patient_id));

create policy "Demo family and doctors can create medication intakes"
on public.medication_intakes for insert
to anon
with check (exists (select 1 from public.demo_users du where du.patient_id = medication_intakes.patient_id and du.role in ('family', 'doctor')));

create policy "Demo family and doctors can update medication intakes"
on public.medication_intakes for update
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = medication_intakes.patient_id and du.role in ('family', 'doctor')))
with check (exists (select 1 from public.demo_users du where du.patient_id = medication_intakes.patient_id and du.role in ('family', 'doctor')));

drop policy if exists "Demo doctors can create medications" on public.medications;

create policy "Demo family and doctors can create medications"
on public.medications for insert
to anon
with check (exists (select 1 from public.demo_users du where du.patient_id = medications.patient_id and du.role in ('family', 'doctor')));

insert into public.medication_intakes (patient_id, medication_id, scheduled_date, status, taken_at, notes)
select
  '11111111-1111-4111-8111-111111111111'::uuid,
  m.id,
  d.scheduled_date,
  case
    when d.scheduled_date = '2026-06-06'::date and m.name = 'Metformina' then 'atrasado'::public.medication_status
    when d.scheduled_date = '2026-06-07'::date and m.name in ('Metformina', 'Atorvastatina') then 'pendiente'::public.medication_status
    else 'tomado'::public.medication_status
  end,
  case
    when d.scheduled_date = '2026-06-06'::date and m.name = 'Metformina' then null
    when d.scheduled_date = '2026-06-07'::date and m.name in ('Metformina', 'Atorvastatina') then null
    else (d.scheduled_date::timestamp + m.time)::timestamptz
  end,
  case
    when d.scheduled_date = '2026-06-06'::date and m.name = 'Metformina' then 'No se confirmó la toma.'
    else ''
  end
from public.medications m
cross join (
  values
    ('2026-06-01'::date),
    ('2026-06-02'::date),
    ('2026-06-03'::date),
    ('2026-06-04'::date),
    ('2026-06-05'::date),
    ('2026-06-06'::date),
    ('2026-06-07'::date)
) as d(scheduled_date)
where m.patient_id = '11111111-1111-4111-8111-111111111111'
on conflict (medication_id, scheduled_date) do update set
  status = excluded.status,
  taken_at = excluded.taken_at,
  notes = excluded.notes;
