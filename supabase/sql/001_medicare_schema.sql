create extension if not exists pgcrypto;
create schema if not exists app_private;

create type public.app_role as enum ('family', 'doctor', 'senior');
create type public.medication_status as enum ('tomado', 'pendiente', 'atrasado');
create type public.visit_status as enum ('realizada', 'pendiente');
create type public.alert_priority as enum ('baja', 'media', 'alta');
create type public.contact_status as enum ('En línea', 'Disponible', 'Fuera de horario');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'family',
  initials text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null check (age between 0 and 125),
  diagnosis text not null default '',
  emergency_contact text not null default '',
  doctor text not null default '',
  general_status text not null default 'Estable',
  allergies text not null default '',
  mobility_risk text not null default '',
  care_plan text not null default '',
  clinical_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_memberships (
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (patient_id, user_id)
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  dose text not null,
  time time not null,
  status public.medication_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional text not null,
  role text not null,
  visit_date date not null,
  visit_time time not null,
  procedures text not null default '',
  notes text not null default '',
  status public.visit_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.care_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  detail text not null,
  priority public.alert_priority not null default 'media',
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.care_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  role text not null,
  status public.contact_status not null default 'Disponible',
  initials text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger medications_set_updated_at
before update on public.medications
for each row execute function public.set_updated_at();

create trigger visits_set_updated_at
before update on public.visits
for each row execute function public.set_updated_at();

create trigger care_alerts_set_updated_at
before update on public.care_alerts
for each row execute function public.set_updated_at();

create trigger care_contacts_set_updated_at
before update on public.care_contacts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.patient_memberships enable row level security;
alter table public.medications enable row level security;
alter table public.visits enable row level security;
alter table public.care_alerts enable row level security;
alter table public.care_contacts enable row level security;
alter table public.activity_logs enable row level security;

create or replace function app_private.is_patient_member(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_memberships pm
    where pm.patient_id = target_patient_id
      and pm.user_id = auth.uid()
  );
$$;

create or replace function app_private.has_patient_role(target_patient_id uuid, allowed_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_memberships pm
    where pm.patient_id = target_patient_id
      and pm.user_id = auth.uid()
      and pm.role = any(allowed_roles)
  );
$$;

grant usage on schema app_private to authenticated;
revoke all on function app_private.is_patient_member(uuid) from public;
revoke all on function app_private.has_patient_role(uuid, public.app_role[]) from public;
grant execute on function app_private.is_patient_member(uuid) to authenticated;
grant execute on function app_private.has_patient_role(uuid, public.app_role[]) to authenticated;

create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can read patients"
on public.patients for select
to authenticated
using (app_private.is_patient_member(id));

create policy "Doctors can update patients"
on public.patients for update
to authenticated
using (app_private.has_patient_role(id, array['doctor']::public.app_role[]))
with check (app_private.has_patient_role(id, array['doctor']::public.app_role[]));

create policy "Members can read memberships"
on public.patient_memberships for select
to authenticated
using (app_private.is_patient_member(patient_id));

create policy "Members can read medications"
on public.medications for select
to authenticated
using (app_private.is_patient_member(patient_id));

create policy "Doctors can create medications"
on public.medications for insert
to authenticated
with check (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]));

create policy "Doctors can update medications"
on public.medications for update
to authenticated
using (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]));

create policy "Family and doctors can confirm medication"
on public.medications for update
to authenticated
using (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Members can read visits"
on public.visits for select
to authenticated
using (app_private.is_patient_member(patient_id));

create policy "Doctors can manage visits"
on public.visits for all
to authenticated
using (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]));

create policy "Members can read alerts"
on public.care_alerts for select
to authenticated
using (app_private.is_patient_member(patient_id));

create policy "Family and doctors can create alerts"
on public.care_alerts for insert
to authenticated
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Family and doctors can update alerts"
on public.care_alerts for update
to authenticated
using (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Members can read contacts"
on public.care_contacts for select
to authenticated
using (app_private.is_patient_member(patient_id));

create policy "Family and doctors can manage contacts"
on public.care_contacts for all
to authenticated
using (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Members can read activity logs"
on public.activity_logs for select
to authenticated
using (app_private.is_patient_member(patient_id));

create policy "Family and doctors can create activity logs"
on public.activity_logs for insert
to authenticated
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));
