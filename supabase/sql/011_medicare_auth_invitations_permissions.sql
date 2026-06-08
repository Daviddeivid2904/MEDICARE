alter table public.patient_memberships
  add column if not exists access_level text not null default 'full',
  add column if not exists can_manage_patient boolean not null default false,
  add column if not exists can_manage_medications boolean not null default false,
  add column if not exists can_confirm_medications boolean not null default false,
  add column if not exists can_manage_visits boolean not null default false,
  add column if not exists can_confirm_visits boolean not null default false,
  add column if not exists can_manage_contacts boolean not null default false,
  add column if not exists can_view_history boolean not null default true;

alter table public.care_contacts
  add column if not exists email text not null default '',
  add column if not exists access_level text not null default 'viewer',
  add column if not exists can_manage_patient boolean not null default false,
  add column if not exists can_manage_medications boolean not null default false,
  add column if not exists can_confirm_medications boolean not null default false,
  add column if not exists can_manage_visits boolean not null default false,
  add column if not exists can_confirm_visits boolean not null default false,
  add column if not exists can_manage_contacts boolean not null default false,
  add column if not exists can_view_history boolean not null default true,
  add column if not exists invitation_status text not null default 'sin cuenta';

create table if not exists public.care_invitations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  contact_id uuid references public.care_contacts(id) on delete set null,
  invitee_email text not null,
  invitee_name text not null,
  role_label text not null,
  role public.app_role not null default 'family',
  access_level text not null default 'viewer',
  can_manage_patient boolean not null default false,
  can_manage_medications boolean not null default false,
  can_confirm_medications boolean not null default false,
  can_manage_visits boolean not null default false,
  can_confirm_visits boolean not null default false,
  can_manage_contacts boolean not null default false,
  can_view_history boolean not null default true,
  status text not null default 'pending',
  token uuid not null default gen_random_uuid(),
  invited_by_user_id uuid references auth.users(id) on delete set null,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.care_invitations enable row level security;

create index if not exists care_invitations_patient_id_idx on public.care_invitations(patient_id);
create index if not exists care_invitations_contact_id_idx on public.care_invitations(contact_id);
create index if not exists care_invitations_invited_by_user_id_idx on public.care_invitations(invited_by_user_id);
create index if not exists care_invitations_accepted_by_user_id_idx on public.care_invitations(accepted_by_user_id);
create index if not exists care_invitations_invitee_email_idx on public.care_invitations(lower(invitee_email));
create unique index if not exists care_invitations_pending_unique_idx
  on public.care_invitations(patient_id, lower(invitee_email))
  where status = 'pending';

create or replace function app_private.has_patient_permission(target_patient_id uuid, permission_name text)
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
      and pm.user_id = (select auth.uid())
      and case permission_name
        when 'can_manage_patient' then pm.can_manage_patient
        when 'can_manage_medications' then pm.can_manage_medications
        when 'can_confirm_medications' then pm.can_confirm_medications
        when 'can_manage_visits' then pm.can_manage_visits
        when 'can_confirm_visits' then pm.can_confirm_visits
        when 'can_manage_contacts' then pm.can_manage_contacts
        when 'can_view_history' then pm.can_view_history
        else false
      end
  );
$$;

revoke all on function app_private.has_patient_permission(uuid, text) from public;
grant execute on function app_private.has_patient_permission(uuid, text) to authenticated;

update public.patient_memberships
set
  access_level = case role when 'senior' then 'senior_limited' else 'full' end,
  can_manage_patient = role in ('family', 'doctor'),
  can_manage_medications = role in ('family', 'doctor'),
  can_confirm_medications = role in ('family', 'doctor', 'senior'),
  can_manage_visits = role in ('family', 'doctor'),
  can_confirm_visits = role in ('family', 'doctor', 'senior'),
  can_manage_contacts = role in ('family', 'doctor'),
  can_view_history = true;

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists "Authenticated users can create patients" on public.patients;
create policy "Authenticated users can create patients"
on public.patients for insert
to authenticated
with check ((select auth.uid()) is not null and length(trim(name)) > 0 and age between 0 and 125);

drop policy if exists "Users can create first membership or accept invite" on public.patient_memberships;
create policy "Users can create first membership or accept invite"
on public.patient_memberships for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    not exists (select 1 from public.patient_memberships existing where existing.patient_id = patient_memberships.patient_id)
    or exists (
      select 1
      from public.care_invitations ci
      where ci.patient_id = patient_memberships.patient_id
        and lower(ci.invitee_email) = lower((select (auth.jwt() ->> 'email')))
        and ci.status = 'pending'
    )
  )
);

drop policy if exists "Managers can create invitations" on public.care_invitations;
create policy "Managers can create invitations"
on public.care_invitations for insert
to authenticated
with check (app_private.has_patient_permission(patient_id, 'can_manage_contacts'));

drop policy if exists "Managers and invitees can read invitations" on public.care_invitations;
create policy "Managers and invitees can read invitations"
on public.care_invitations for select
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or lower(invitee_email) = lower((select (auth.jwt() ->> 'email')))
);

drop policy if exists "Managers and invitees can update invitations" on public.care_invitations;
create policy "Managers and invitees can update invitations"
on public.care_invitations for update
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or lower(invitee_email) = lower((select (auth.jwt() ->> 'email')))
)
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or lower(invitee_email) = lower((select (auth.jwt() ->> 'email')))
);

drop policy if exists "Doctors can create medications" on public.medications;
drop policy if exists "Members with medication permission can create medications" on public.medications;
create policy "Members with medication permission can create medications"
on public.medications for insert
to authenticated
with check (app_private.has_patient_permission(patient_id, 'can_manage_medications'));

drop policy if exists "Family and doctors can update medications" on public.medications;
drop policy if exists "Members with medication permission can update medications" on public.medications;
create policy "Members with medication permission can update medications"
on public.medications for update
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_medications')
  or app_private.has_patient_permission(patient_id, 'can_confirm_medications')
)
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_medications')
  or app_private.has_patient_permission(patient_id, 'can_confirm_medications')
);

drop policy if exists "Family and doctors can create medication intakes" on public.medication_intakes;
drop policy if exists "Members with medication confirmation can create medication intakes" on public.medication_intakes;
create policy "Members with medication confirmation can create medication intakes"
on public.medication_intakes for insert
to authenticated
with check (
  app_private.has_patient_permission(patient_id, 'can_confirm_medications')
  or app_private.has_patient_permission(patient_id, 'can_manage_medications')
);

drop policy if exists "Family and doctors can update medication intakes" on public.medication_intakes;
drop policy if exists "Members with medication confirmation can update medication intakes" on public.medication_intakes;
create policy "Members with medication confirmation can update medication intakes"
on public.medication_intakes for update
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_confirm_medications')
  or app_private.has_patient_permission(patient_id, 'can_manage_medications')
)
with check (
  app_private.has_patient_permission(patient_id, 'can_confirm_medications')
  or app_private.has_patient_permission(patient_id, 'can_manage_medications')
);

drop policy if exists "Doctors can create visits" on public.visits;
drop policy if exists "Members with visit permission can create visits" on public.visits;
create policy "Members with visit permission can create visits"
on public.visits for insert
to authenticated
with check (app_private.has_patient_permission(patient_id, 'can_manage_visits'));

drop policy if exists "Doctors can update visits" on public.visits;
drop policy if exists "Members with visit permission can update visits" on public.visits;
create policy "Members with visit permission can update visits"
on public.visits for update
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_visits')
  or app_private.has_patient_permission(patient_id, 'can_confirm_visits')
)
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_visits')
  or app_private.has_patient_permission(patient_id, 'can_confirm_visits')
);

drop policy if exists "Doctors can delete visits" on public.visits;
drop policy if exists "Members with visit management can delete visits" on public.visits;
create policy "Members with visit management can delete visits"
on public.visits for delete
to authenticated
using (app_private.has_patient_permission(patient_id, 'can_manage_visits'));

drop policy if exists "Family and doctors can create contacts" on public.care_contacts;
drop policy if exists "Members with contact permission can create contacts" on public.care_contacts;
create policy "Members with contact permission can create contacts"
on public.care_contacts for insert
to authenticated
with check (app_private.has_patient_permission(patient_id, 'can_manage_contacts'));

drop policy if exists "Family and doctors can update contacts" on public.care_contacts;
drop policy if exists "Members with contact permission can update contacts" on public.care_contacts;
create policy "Members with contact permission can update contacts"
on public.care_contacts for update
to authenticated
using (app_private.has_patient_permission(patient_id, 'can_manage_contacts'))
with check (app_private.has_patient_permission(patient_id, 'can_manage_contacts'));

drop policy if exists "Family and doctors can delete contacts" on public.care_contacts;
drop policy if exists "Members with contact permission can delete contacts" on public.care_contacts;
create policy "Members with contact permission can delete contacts"
on public.care_contacts for delete
to authenticated
using (app_private.has_patient_permission(patient_id, 'can_manage_contacts'));

drop policy if exists "Members with medication permission can create reminder outbox" on public.email_reminder_outbox;
create policy "Members with medication permission can create reminder outbox"
on public.email_reminder_outbox for insert
to authenticated
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_medications')
  or app_private.has_patient_permission(patient_id, 'can_manage_contacts')
);
