drop policy "Demo doctors can create visits" on public.visits;

create policy "Demo family and doctors can create visits"
on public.visits for insert
to anon
with check (
  exists (
    select 1
    from public.demo_users du
    where du.patient_id = visits.patient_id
      and du.role in ('family', 'doctor')
  )
);
