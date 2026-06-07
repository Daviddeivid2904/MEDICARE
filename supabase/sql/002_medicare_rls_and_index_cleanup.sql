alter function public.set_updated_at() set search_path = public;

create index patient_memberships_user_id_idx on public.patient_memberships(user_id);
create index medications_patient_id_idx on public.medications(patient_id);
create index visits_patient_id_idx on public.visits(patient_id);
create index care_alerts_patient_id_idx on public.care_alerts(patient_id);
create index care_contacts_patient_id_idx on public.care_contacts(patient_id);
create index activity_logs_patient_id_idx on public.activity_logs(patient_id);

alter policy "Users can read own profile"
on public.profiles
using (id = (select auth.uid()));

alter policy "Users can update own profile"
on public.profiles
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

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
      and pm.user_id = (select auth.uid())
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
      and pm.user_id = (select auth.uid())
      and pm.role = any(allowed_roles)
  );
$$;

revoke all on function app_private.is_patient_member(uuid) from public;
revoke all on function app_private.has_patient_role(uuid, public.app_role[]) from public;
grant execute on function app_private.is_patient_member(uuid) to authenticated;
grant execute on function app_private.has_patient_role(uuid, public.app_role[]) to authenticated;

drop policy "Doctors can update medications" on public.medications;

alter policy "Family and doctors can confirm medication"
on public.medications
rename to "Family and doctors can update medications";

drop policy "Doctors can manage visits" on public.visits;

create policy "Doctors can create visits"
on public.visits for insert
to authenticated
with check (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]));

create policy "Doctors can update visits"
on public.visits for update
to authenticated
using (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]));

create policy "Doctors can delete visits"
on public.visits for delete
to authenticated
using (app_private.has_patient_role(patient_id, array['doctor']::public.app_role[]));

drop policy "Family and doctors can manage contacts" on public.care_contacts;

create policy "Family and doctors can create contacts"
on public.care_contacts for insert
to authenticated
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Family and doctors can update contacts"
on public.care_contacts for update
to authenticated
using (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]))
with check (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));

create policy "Family and doctors can delete contacts"
on public.care_contacts for delete
to authenticated
using (app_private.has_patient_role(patient_id, array['family', 'doctor']::public.app_role[]));
