do $$
begin
  create type public.organization_member_role as enum ('admin', 'professional');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.care_context_type as enum ('family', 'independent_professional', 'institutional');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text not null default 'institution',
  contact_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_member_role not null,
  display_name text not null default '',
  specialty text not null default '',
  can_manage_organization boolean not null default false,
  can_manage_professionals boolean not null default false,
  can_manage_patients boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.patient_care_contexts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete cascade,
  context_type public.care_context_type not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint patient_care_context_owner_check check (
    (context_type = 'institutional' and organization_id is not null)
    or (context_type in ('family', 'independent_professional') and owner_user_id is not null)
  )
);

create table if not exists public.patient_professional_assignments (
  patient_id uuid not null references public.patients(id) on delete cascade,
  professional_user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  specialty text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (patient_id, professional_user_id)
);

create table if not exists public.patient_family_accesses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  family_user_id uuid references auth.users(id) on delete cascade,
  invited_by_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  invitee_email text not null default '',
  invitee_name text not null default '',
  relationship text not null default '',
  access_level text not null default 'viewer',
  can_manage_patient boolean not null default false,
  can_manage_medications boolean not null default false,
  can_confirm_medications boolean not null default false,
  can_manage_visits boolean not null default false,
  can_confirm_visits boolean not null default false,
  can_manage_contacts boolean not null default false,
  can_view_history boolean not null default true,
  invitation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.patient_family_accesses
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists invitee_email text not null default '',
  add column if not exists invitee_name text not null default '',
  add column if not exists relationship text not null default '',
  add column if not exists invitation_status text not null default 'pending',
  add column if not exists accepted_at timestamptz;

alter table public.patient_family_accesses
  drop constraint if exists patient_family_accesses_pkey;

alter table public.patient_family_accesses
  alter column family_user_id drop not null;

update public.patient_family_accesses
set id = gen_random_uuid()
where id is null;

alter table public.patient_family_accesses
  alter column id set not null;

alter table public.patient_family_accesses
  add constraint patient_family_accesses_pkey primary key (id);

create table if not exists public.patient_clinical_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  created_by_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  event_type text not null default 'nota',
  title text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists organization_memberships_user_id_idx
  on public.organization_memberships(user_id);
create index if not exists patient_care_contexts_patient_id_idx
  on public.patient_care_contexts(patient_id);
create index if not exists patient_care_contexts_organization_id_idx
  on public.patient_care_contexts(organization_id);
create index if not exists patient_professional_assignments_professional_user_id_idx
  on public.patient_professional_assignments(professional_user_id);
create index if not exists patient_professional_assignments_organization_id_idx
  on public.patient_professional_assignments(organization_id);
create index if not exists patient_family_accesses_family_user_id_idx
  on public.patient_family_accesses(family_user_id);
create index if not exists patient_family_accesses_organization_id_idx
  on public.patient_family_accesses(organization_id);
create index if not exists patient_family_accesses_invitee_email_idx
  on public.patient_family_accesses(lower(invitee_email));
create unique index if not exists patient_family_accesses_patient_email_unique_idx
  on public.patient_family_accesses(patient_id, lower(invitee_email))
  where invitee_email <> '';
create index if not exists patient_clinical_history_patient_id_created_at_idx
  on public.patient_clinical_history(patient_id, created_at desc);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.patient_care_contexts enable row level security;
alter table public.patient_professional_assignments enable row level security;
alter table public.patient_family_accesses enable row level security;
alter table public.patient_clinical_history enable row level security;

grant select, insert, update, delete on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organization_memberships to authenticated;
grant select, insert, update, delete on table public.patient_care_contexts to authenticated;
grant select, insert, update, delete on table public.patient_professional_assignments to authenticated;
grant select, insert, update, delete on table public.patient_family_accesses to authenticated;
grant select, insert, update, delete on table public.patient_clinical_history to authenticated;

create or replace function app_private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.can_manage_organization_patients(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and (om.can_manage_organization or om.can_manage_patients)
  );
$$;

revoke all on function app_private.is_organization_member(uuid) from public;
revoke all on function app_private.can_manage_organization_patients(uuid) from public;
grant execute on function app_private.is_organization_member(uuid) to authenticated;
grant execute on function app_private.can_manage_organization_patients(uuid) to authenticated;

drop policy if exists "Organization members can read organization" on public.organizations;
create policy "Organization members can read organization"
on public.organizations for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships om
    where om.organization_id = organizations.id
      and om.user_id = (select auth.uid())
  )
);

drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations"
on public.organizations for insert
to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "Organization admins can update organization" on public.organizations;
create policy "Organization admins can update organization"
on public.organizations for update
to authenticated
using (app_private.can_manage_organization_patients(id))
with check (app_private.can_manage_organization_patients(id));

drop policy if exists "Organization members can read memberships" on public.organization_memberships;
create policy "Organization members can read memberships"
on public.organization_memberships for select
to authenticated
using (app_private.is_organization_member(organization_id));

drop policy if exists "Organization admins can manage memberships" on public.organization_memberships;
create policy "Organization admins can manage memberships"
on public.organization_memberships for all
to authenticated
using (app_private.can_manage_organization_patients(organization_id))
with check (app_private.can_manage_organization_patients(organization_id));

drop policy if exists "Users can create own initial organization membership" on public.organization_memberships;
create policy "Users can create own initial organization membership"
on public.organization_memberships for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and not exists (
    select 1
    from public.organization_memberships existing
    where existing.organization_id = organization_memberships.organization_id
  )
);

drop policy if exists "Members can read care contexts" on public.patient_care_contexts;
create policy "Members can read care contexts"
on public.patient_care_contexts for select
to authenticated
using (
  app_private.is_patient_member(patient_id)
  or (organization_id is not null and app_private.is_organization_member(organization_id))
  or owner_user_id = (select auth.uid())
);

drop policy if exists "Managers can create care contexts" on public.patient_care_contexts;
create policy "Managers can create care contexts"
on public.patient_care_contexts for insert
to authenticated
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_patient')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
  or owner_user_id = (select auth.uid())
);

drop policy if exists "Members can read professional assignments" on public.patient_professional_assignments;
create policy "Members can read professional assignments"
on public.patient_professional_assignments for select
to authenticated
using (
  app_private.is_patient_member(patient_id)
  or professional_user_id = (select auth.uid())
  or (organization_id is not null and app_private.is_organization_member(organization_id))
);

drop policy if exists "Patient or organization managers can manage professional assignments" on public.patient_professional_assignments;
create policy "Patient or organization managers can manage professional assignments"
on public.patient_professional_assignments for all
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
)
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
);

drop policy if exists "Members can read family accesses" on public.patient_family_accesses;
create policy "Members can read family accesses"
on public.patient_family_accesses for select
to authenticated
using (
  app_private.is_patient_member(patient_id)
  or family_user_id = (select auth.uid())
  or lower(invitee_email) = lower((select (auth.jwt() ->> 'email')))
  or (organization_id is not null and app_private.is_organization_member(organization_id))
);

drop policy if exists "Patient or organization managers can manage family accesses" on public.patient_family_accesses;
create policy "Patient or organization managers can manage family accesses"
on public.patient_family_accesses for all
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
)
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
);

drop policy if exists "Members can read clinical history" on public.patient_clinical_history;
create policy "Members can read clinical history"
on public.patient_clinical_history for select
to authenticated
using (
  app_private.is_patient_member(patient_id)
  or (organization_id is not null and app_private.is_organization_member(organization_id))
);

drop policy if exists "Care team can create clinical history" on public.patient_clinical_history;
create policy "Care team can create clinical history"
on public.patient_clinical_history for insert
to authenticated
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_patient')
  or app_private.has_patient_permission(patient_id, 'can_manage_medications')
  or app_private.has_patient_permission(patient_id, 'can_manage_visits')
  or (organization_id is not null and app_private.is_organization_member(organization_id))
);
