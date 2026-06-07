create type public.reminder_status as enum ('queued', 'sent', 'cancelled');

create table public.demo_users (
  id text primary key,
  patient_id uuid not null references public.patients(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.app_role not null,
  initials text not null,
  created_at timestamptz not null default now()
);

create table public.medication_reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  recipient_email text not null,
  scheduled_time time not null,
  enabled boolean not null default true,
  created_by_demo_user text references public.demo_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_reminder_outbox (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  reminder_id uuid references public.medication_reminders(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  body text not null,
  status public.reminder_status not null default 'queued',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create trigger medication_reminders_set_updated_at
before update on public.medication_reminders
for each row execute function public.set_updated_at();

alter table public.demo_users enable row level security;
alter table public.medication_reminders enable row level security;
alter table public.email_reminder_outbox enable row level security;

create index demo_users_patient_id_idx on public.demo_users(patient_id);
create index medication_reminders_patient_id_idx on public.medication_reminders(patient_id);
create index medication_reminders_medication_id_idx on public.medication_reminders(medication_id);
create index email_reminder_outbox_patient_id_idx on public.email_reminder_outbox(patient_id);
create index email_reminder_outbox_reminder_id_idx on public.email_reminder_outbox(reminder_id);

create policy "Demo users are readable"
on public.demo_users for select
to anon, authenticated
using (true);

create policy "Demo users can read patients"
on public.patients for select
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = patients.id));

create policy "Demo users can update patients"
on public.patients for update
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = patients.id and du.role = 'doctor'))
with check (exists (select 1 from public.demo_users du where du.patient_id = patients.id and du.role = 'doctor'));

create policy "Demo users can read medications"
on public.medications for select
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = medications.patient_id));

create policy "Demo doctors can create medications"
on public.medications for insert
to anon
with check (exists (select 1 from public.demo_users du where du.patient_id = medications.patient_id and du.role = 'doctor'));

create policy "Demo users can update medications"
on public.medications for update
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = medications.patient_id and du.role in ('family', 'doctor')))
with check (exists (select 1 from public.demo_users du where du.patient_id = medications.patient_id and du.role in ('family', 'doctor')));

create policy "Demo users can read visits"
on public.visits for select
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = visits.patient_id));

create policy "Demo doctors can create visits"
on public.visits for insert
to anon
with check (exists (select 1 from public.demo_users du where du.patient_id = visits.patient_id and du.role = 'doctor'));

create policy "Demo doctors can update visits"
on public.visits for update
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = visits.patient_id and du.role = 'doctor'))
with check (exists (select 1 from public.demo_users du where du.patient_id = visits.patient_id and du.role = 'doctor'));

create policy "Demo users can read alerts"
on public.care_alerts for select
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = care_alerts.patient_id));

create policy "Demo family and doctors can create alerts"
on public.care_alerts for insert
to anon
with check (exists (select 1 from public.demo_users du where du.patient_id = care_alerts.patient_id and du.role in ('family', 'doctor')));

create policy "Demo family and doctors can update alerts"
on public.care_alerts for update
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = care_alerts.patient_id and du.role in ('family', 'doctor')))
with check (exists (select 1 from public.demo_users du where du.patient_id = care_alerts.patient_id and du.role in ('family', 'doctor')));

create policy "Demo users can read contacts"
on public.care_contacts for select
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = care_contacts.patient_id));

create policy "Demo family and doctors can create contacts"
on public.care_contacts for insert
to anon
with check (exists (select 1 from public.demo_users du where du.patient_id = care_contacts.patient_id and du.role in ('family', 'doctor')));

create policy "Demo family and doctors can update contacts"
on public.care_contacts for update
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = care_contacts.patient_id and du.role in ('family', 'doctor')))
with check (exists (select 1 from public.demo_users du where du.patient_id = care_contacts.patient_id and du.role in ('family', 'doctor')));

create policy "Demo users can read activity logs"
on public.activity_logs for select
to anon
using (exists (select 1 from public.demo_users du where du.patient_id = activity_logs.patient_id));

create policy "Demo family and doctors can create activity logs"
on public.activity_logs for insert
to anon
with check (exists (select 1 from public.demo_users du where du.patient_id = activity_logs.patient_id and du.role in ('family', 'doctor')));

create policy "Demo users can read reminders"
on public.medication_reminders for select
to anon, authenticated
using (exists (select 1 from public.demo_users du where du.patient_id = medication_reminders.patient_id));

create policy "Demo family and doctors can create reminders"
on public.medication_reminders for insert
to anon, authenticated
with check (exists (select 1 from public.demo_users du where du.patient_id = medication_reminders.patient_id and du.role in ('family', 'doctor')));

create policy "Demo family and doctors can update reminders"
on public.medication_reminders for update
to anon, authenticated
using (exists (select 1 from public.demo_users du where du.patient_id = medication_reminders.patient_id and du.role in ('family', 'doctor')))
with check (exists (select 1 from public.demo_users du where du.patient_id = medication_reminders.patient_id and du.role in ('family', 'doctor')));

create policy "Demo users can read reminder outbox"
on public.email_reminder_outbox for select
to anon, authenticated
using (exists (select 1 from public.demo_users du where du.patient_id = email_reminder_outbox.patient_id));

create policy "Demo family and doctors can create reminder outbox"
on public.email_reminder_outbox for insert
to anon, authenticated
with check (exists (select 1 from public.demo_users du where du.patient_id = email_reminder_outbox.patient_id and du.role in ('family', 'doctor')));

insert into public.patients (
  id,
  name,
  age,
  diagnosis,
  emergency_contact,
  doctor,
  general_status,
  allergies,
  mobility_risk,
  care_plan,
  clinical_notes
) values (
  '11111111-1111-4111-8111-111111111111',
  'Rosa Martínez',
  78,
  'Hipertensión y diabetes tipo 2',
  'Ana Gómez · +54 11 5555-0142',
  'Dra. Lucía Pérez',
  'Estable',
  'Sin alergias medicamentosas registradas',
  'Riesgo medio de caídas',
  'Control de presión diario, caminata asistida y revisión semanal.',
  'Mantener hidratación. Evaluar adherencia a Metformina durante la semana.'
) on conflict (id) do update set
  name = excluded.name,
  age = excluded.age,
  diagnosis = excluded.diagnosis,
  emergency_contact = excluded.emergency_contact,
  doctor = excluded.doctor,
  general_status = excluded.general_status,
  allergies = excluded.allergies,
  mobility_risk = excluded.mobility_risk,
  care_plan = excluded.care_plan,
  clinical_notes = excluded.clinical_notes;

insert into public.demo_users (id, patient_id, full_name, email, role, initials)
values
  ('family-demo', '11111111-1111-4111-8111-111111111111', 'Ana Gómez', 'familiar@medicare.demo', 'family', 'AG'),
  ('doctor-demo', '11111111-1111-4111-8111-111111111111', 'Dra. Lucía Pérez', 'medico@medicare.demo', 'doctor', 'LP'),
  ('senior-demo', '11111111-1111-4111-8111-111111111111', 'Rosa Martínez', 'paciente@medicare.demo', 'senior', 'RM')
on conflict (id) do update set
  patient_id = excluded.patient_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  initials = excluded.initials;

insert into public.medications (id, patient_id, name, dose, time, status)
values
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 'Losartán', '50 mg', '08:00', 'tomado'),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Metformina', '850 mg', '12:30', 'pendiente'),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111111', 'Atorvastatina', '20 mg', '20:00', 'pendiente'),
  ('22222222-2222-4222-8222-222222222224', '11111111-1111-4111-8111-111111111111', 'Vitamina D', '1 cápsula', '09:00', 'atrasado')
on conflict (id) do update set
  name = excluded.name,
  dose = excluded.dose,
  time = excluded.time,
  status = excluded.status;

insert into public.visits (id, patient_id, professional, role, visit_date, visit_time, procedures, notes, status)
values
  ('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111111', 'Dra. Lucía Pérez', 'Médica clínica', '2026-06-07', '10:30', 'Control de presión, glucemia y revisión de medicación.', 'Paciente estable. Reforzar hidratación y caminata suave.', 'realizada'),
  ('33333333-3333-4333-8333-333333333332', '11111111-1111-4111-8111-111111111111', 'Martín Acosta', 'Kinesiólogo', '2026-06-08', '16:00', 'Movilidad articular y ejercicios de equilibrio.', 'Visita programada para seguimiento semanal.', 'pendiente'),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Enf. Camila Ríos', 'Enfermera domiciliaria', '2026-06-05', '09:15', 'Curación menor y control de signos vitales.', 'Sin signos de alarma. Familia notificada.', 'realizada')
on conflict (id) do update set
  professional = excluded.professional,
  role = excluded.role,
  visit_date = excluded.visit_date,
  visit_time = excluded.visit_time,
  procedures = excluded.procedures,
  notes = excluded.notes,
  status = excluded.status;

insert into public.care_alerts (id, patient_id, title, detail, priority, resolved)
values
  ('44444444-4444-4444-8444-444444444441', '11111111-1111-4111-8111-111111111111', 'Medicación pendiente', 'Metformina de las 12:30 todavía no fue confirmada.', 'alta', false),
  ('44444444-4444-4444-8444-444444444442', '11111111-1111-4111-8111-111111111111', 'Control atrasado', 'Falta registrar el control de presión vespertino.', 'media', false),
  ('44444444-4444-4444-8444-444444444443', '11111111-1111-4111-8111-111111111111', 'Visita médica no registrada', 'Confirmar observaciones de la última visita de enfermería.', 'baja', false)
on conflict (id) do update set
  title = excluded.title,
  detail = excluded.detail,
  priority = excluded.priority,
  resolved = excluded.resolved;

insert into public.care_contacts (id, patient_id, name, role, status, initials)
values
  ('55555555-5555-4555-8555-555555555551', '11111111-1111-4111-8111-111111111111', 'Ana Gómez', 'Hija responsable', 'En línea', 'AG'),
  ('55555555-5555-4555-8555-555555555552', '11111111-1111-4111-8111-111111111111', 'Carlos Gómez', 'Familiar autorizado', 'Disponible', 'CG'),
  ('55555555-5555-4555-8555-555555555553', '11111111-1111-4111-8111-111111111111', 'Dra. Lucía Pérez', 'Médica asignada', 'Disponible', 'LP'),
  ('55555555-5555-4555-8555-555555555554', '11111111-1111-4111-8111-111111111111', 'Camila Ríos', 'Cuidadora domiciliaria', 'Fuera de horario', 'CR')
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  initials = excluded.initials;

insert into public.activity_logs (id, patient_id, message, created_at)
values
  ('66666666-6666-4666-8666-666666666661', '11111111-1111-4111-8111-111111111111', 'Visita clínica registrada con estado estable.', now() - interval '2 hours'),
  ('66666666-6666-4666-8666-666666666662', '11111111-1111-4111-8111-111111111111', 'Presión arterial dentro de rango.', now() - interval '4 hours'),
  ('66666666-6666-4666-8666-666666666663', '11111111-1111-4111-8111-111111111111', 'Medicación nocturna confirmada.', now() - interval '1 day')
on conflict (id) do update set
  message = excluded.message;

insert into public.medication_reminders (
  id,
  patient_id,
  medication_id,
  recipient_email,
  scheduled_time,
  enabled,
  created_by_demo_user
) values (
  '77777777-7777-4777-8777-777777777771',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'familiar@medicare.demo',
  '12:15',
  true,
  'family-demo'
) on conflict (id) do update set
  recipient_email = excluded.recipient_email,
  scheduled_time = excluded.scheduled_time,
  enabled = excluded.enabled;
