create index if not exists patient_care_contexts_owner_user_id_idx
  on public.patient_care_contexts(owner_user_id);
create index if not exists patient_clinical_history_created_by_user_id_idx
  on public.patient_clinical_history(created_by_user_id);
create index if not exists patient_clinical_history_organization_id_idx
  on public.patient_clinical_history(organization_id);
create index if not exists patient_family_accesses_invited_by_user_id_idx
  on public.patient_family_accesses(invited_by_user_id);

drop policy if exists "Organization admins can manage memberships" on public.organization_memberships;
drop policy if exists "Users can create own initial organization membership" on public.organization_memberships;
create policy "Organization admins or initial owner can create memberships"
on public.organization_memberships for insert
to authenticated
with check (
  app_private.can_manage_organization_patients(organization_id)
  or (
    user_id = (select auth.uid())
    and not exists (
      select 1
      from public.organization_memberships existing
      where existing.organization_id = organization_memberships.organization_id
    )
  )
);

create policy "Organization admins can update memberships"
on public.organization_memberships for update
to authenticated
using (app_private.can_manage_organization_patients(organization_id))
with check (app_private.can_manage_organization_patients(organization_id));

create policy "Organization admins can delete memberships"
on public.organization_memberships for delete
to authenticated
using (app_private.can_manage_organization_patients(organization_id));

drop policy if exists "Patient or organization managers can manage professional assignments" on public.patient_professional_assignments;
create policy "Patient or organization managers can create professional assignments"
on public.patient_professional_assignments for insert
to authenticated
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
);

create policy "Patient or organization managers can update professional assignments"
on public.patient_professional_assignments for update
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
)
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
);

create policy "Patient or organization managers can delete professional assignments"
on public.patient_professional_assignments for delete
to authenticated
using (
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
  or lower(invitee_email) = lower((select auth.jwt()) ->> 'email')
  or (organization_id is not null and app_private.is_organization_member(organization_id))
);

drop policy if exists "Patient or organization managers can manage family accesses" on public.patient_family_accesses;
create policy "Patient or organization managers can create family accesses"
on public.patient_family_accesses for insert
to authenticated
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
);

create policy "Patient or organization managers can update family accesses"
on public.patient_family_accesses for update
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
)
with check (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
);

create policy "Patient or organization managers can delete family accesses"
on public.patient_family_accesses for delete
to authenticated
using (
  app_private.has_patient_permission(patient_id, 'can_manage_contacts')
  or (organization_id is not null and app_private.can_manage_organization_patients(organization_id))
);
