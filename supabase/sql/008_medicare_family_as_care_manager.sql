drop policy if exists "Demo users can update patients" on public.patients;

create policy "Demo family and doctors can update patients"
on public.patients for update
to anon
using (
  exists (
    select 1
    from public.demo_users du
    where du.patient_id = patients.id
      and du.role in ('family', 'doctor')
  )
)
with check (
  exists (
    select 1
    from public.demo_users du
    where du.patient_id = patients.id
      and du.role in ('family', 'doctor')
  )
);
