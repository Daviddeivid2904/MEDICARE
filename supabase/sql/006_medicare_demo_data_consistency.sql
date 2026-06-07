update public.care_alerts
set resolved = false
where id in (
  '44444444-4444-4444-8444-444444444441',
  '44444444-4444-4444-8444-444444444442'
);

update public.care_alerts
set resolved = true
where id = '44444444-4444-4444-8444-444444444443';

update public.visits
set status = 'realizada'
where id in (
  '33333333-3333-4333-8333-333333333331',
  '33333333-3333-4333-8333-333333333333'
);

update public.visits
set status = 'pendiente', visit_date = '2026-06-08', visit_time = '16:00'
where id = '33333333-3333-4333-8333-333333333332';

update public.medications
set status = case id
  when '22222222-2222-4222-8222-222222222221' then 'tomado'::public.medication_status
  when '22222222-2222-4222-8222-222222222224' then 'tomado'::public.medication_status
  when '22222222-2222-4222-8222-222222222222' then 'pendiente'::public.medication_status
  when '22222222-2222-4222-8222-222222222223' then 'pendiente'::public.medication_status
  else status
end
where id in (
  '22222222-2222-4222-8222-222222222221',
  '22222222-2222-4222-8222-222222222222',
  '22222222-2222-4222-8222-222222222223',
  '22222222-2222-4222-8222-222222222224'
);

insert into public.activity_logs (patient_id, message)
values (
  '11111111-1111-4111-8111-111111111111',
  'Demo reorganizada: 1 visita pendiente, 2 visitas realizadas y alertas coherentes.'
);
