-- Demo data: one HR admin, 20 employees of a small software company, and sample leave requests,
-- claims and payslips. Same people and the same generation rules as the original Prisma seed.
--
-- Accounts sign in with `<username>@hrpilot.test` (the login form adds the domain), password
-- `admin` for the admin and `password123` for every employee.
-- `supabase db reset` re-applies the migrations and runs this file, back to a clean demo state.

do $$
declare
  admin_id uuid;
  emp_ids uuid[] := '{}';
  emp_salaries numeric[] := '{}';
  uid uuid;
  emp record;
  i int;
  j int;
  n int;
  leave_types public.leave_type[] := array['ANNUAL', 'SICK', 'UNPAID']::public.leave_type[];
  statuses public.request_status[] := array['APPROVED', 'APPROVED', 'PENDING', 'REJECTED']::public.request_status[];
  claim_categories public.claim_category[] := array['FOOD', 'TRAVEL', 'MEDICAL', 'OTHER']::public.claim_category[];
  l_type public.leave_type;
  l_status public.request_status;
  c_category public.claim_category;
  base_offset int;
  duration int;
  start_d date;
  reasons text[];
  descriptions text[];
  amount_band numeric;
  months text[] := array['2026-03', '2026-04', '2026-05', '2026-06'];
  m text;
  salary numeric;
  ded numeric;
begin
  -- Wipe (reset already does, but this keeps the file re-runnable by hand).
  delete from public.payslips;
  delete from public.claims;
  delete from public.leave_requests;
  delete from public.profiles;
  delete from auth.users where email like '%@hrpilot.test';

  create temp table seed_people (
    ord int, name text, username text, job_title text, department text, date_joined date,
    basic_salary numeric, is_admin boolean
  ) on commit drop;

  insert into seed_people values
    (0,  'Nurul Huda (HR Admin)',  'admin',           'HR Administrator',         'Human Resources',   '2021-01-11', 9500,  true),
    (1,  'Ahmad Faiz Rahman',      'ahmad.faiz',      'Senior Software Engineer', 'Engineering',       '2022-03-14', 8500,  false),
    (2,  'Siti Aminah Yusof',      'siti.aminah',     'Software Engineer',        'Engineering',       '2023-06-01', 6000,  false),
    (3,  'Tan Wei Jian',           'wei.jian',        'Engineering Manager',      'Engineering',       '2020-09-21', 12000, false),
    (4,  'Priya Sharma',           'priya.sharma',    'QA Engineer',              'Quality Assurance', '2022-11-07', 5500,  false),
    (5,  'Muhammad Hafiz Ismail',  'hafiz.ismail',    'DevOps Engineer',          'Infrastructure',    '2021-07-19', 7000,  false),
    (6,  'Nur Alia Zainal',        'alia.zainal',     'Product Manager',          'Product',           '2021-02-08', 9000,  false),
    (7,  'Kevin Lee Chun Wai',     'kevin.lee',       'Software Engineer',        'Engineering',       '2023-01-16', 6000,  false),
    (8,  'Farah Aziz',             'farah.aziz',      'UI/UX Designer',           'Design',            '2022-05-30', 6000,  false),
    (9,  'Rajesh Kumar',           'rajesh.kumar',    'Data Analyst',             'Data',              '2023-04-11', 5800,  false),
    (10, 'Chong Mei Ling',         'mei.ling',        'Senior Software Engineer', 'Engineering',       '2021-10-04', 8500,  false),
    (11, 'Aiman Yusof',            'aiman.yusof',     'Software Engineer',        'Engineering',       '2024-02-19', 5800,  false),
    (12, 'Nadia Rahman',           'nadia.rahman',    'QA Engineer',              'Quality Assurance', '2022-08-22', 5500,  false),
    (13, 'Daniel Wong',            'daniel.wong',     'DevOps Engineer',          'Infrastructure',    '2023-09-05', 6800,  false),
    (14, 'Syafiqah Ismail',        'syafiqah.ismail', 'Product Designer',         'Design',            '2022-01-17', 6200,  false),
    (15, 'Arun Prakash',           'arun.prakash',    'Data Scientist',           'Data',              '2021-12-13', 8000,  false),
    (16, 'Hafizah Zainal',         'hafizah.zainal',  'Technical Writer',         'Product',           '2023-03-27', 5500,  false),
    (17, 'Lim Jun Hao',            'jun.hao',         'Software Engineer',        'Engineering',       '2024-05-06', 5700,  false),
    (18, 'Zulaikha Osman',         'zulaikha.osman',  'Scrum Master',             'Product',           '2022-06-20', 7500,  false),
    (19, 'Vincent Tan',            'vincent.tan',     'Staff Engineer',           'Engineering',       '2020-04-02', 11000, false),
    (20, 'Amirul Hakim',           'amirul.hakim',    'IT Support Specialist',    'Operations',        '2023-07-10', 4500,  false);

  -- Auth users + identities (GoTrue needs an identity row for email sign-in and '' rather than
  -- NULL in the token columns), then the matching profile.
  for emp in select * from seed_people order by ord loop
    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      emp.username || '@hrpilot.test',
      extensions.crypt(case when emp.is_admin then 'admin' else 'password123' end, extensions.gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('username', emp.username, 'name', emp.name),
      now(), now(),
      '', '', '', '', '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text, 'email',
      jsonb_build_object('sub', uid::text, 'email', emp.username || '@hrpilot.test', 'email_verified', true),
      now(), now(), now()
    );

    insert into public.profiles (id, name, email, username, role, job_title, department, date_joined)
    values (
      uid, emp.name, emp.username || '@hrpilot.com', emp.username,
      case when emp.is_admin then 'ADMIN' else 'EMPLOYEE' end::public.user_role,
      emp.job_title, emp.department, emp.date_joined
    );

    if emp.is_admin then
      admin_id := uid;
    else
      emp_ids := emp_ids || uid;
      emp_salaries := emp_salaries || emp.basic_salary;
    end if;
  end loop;

  -- Leave requests (i and j are 0-based, as in the original seed).
  for i in 0 .. array_length(emp_ids, 1) - 1 loop
    n := 1 + (i % 3);
    for j in 0 .. n - 1 loop
      l_type := leave_types[((i + j) % 3) + 1];
      l_status := statuses[((i + j) % 4) + 1];
      base_offset := case when l_status = 'PENDING' then 5 + ((i + j) % 20) else -(10 + (i + j) * 3) end;
      start_d := current_date + base_offset;
      duration := case when l_type = 'SICK' then 1 + (j % 2) else 1 + (j % 4) end;
      reasons := case l_type
        when 'ANNUAL' then array['Family vacation', 'Balik kampung for the holidays', 'Personal trip', 'Attending a wedding', 'Taking time off to recharge']
        when 'SICK' then array['Fever and flu', 'Medical appointment', 'Down with a cold', 'Food poisoning', 'Recovering from minor surgery']
        else array['Extended personal matters', 'Family emergency', 'Additional time off requested']
      end;

      insert into public.leave_requests (
        user_id, type, start_date, end_date, days, reason, status, decided_by_id, decided_at, created_at
      ) values (
        emp_ids[i + 1], l_type, start_d, start_d + duration - 1, duration,
        reasons[((i + j) % array_length(reasons, 1)) + 1], l_status,
        case when l_status = 'PENDING' then null else admin_id end,
        case when l_status = 'PENDING' then null else now() end,
        clock_timestamp()
      );
    end loop;
  end loop;

  -- Claims.
  for i in 0 .. array_length(emp_ids, 1) - 1 loop
    n := 1 + (i % 3);
    for j in 0 .. n - 1 loop
      c_category := claim_categories[((i + j) % 4) + 1];
      l_status := statuses[((i + j + 1) % 4) + 1];
      descriptions := case c_category
        when 'FOOD' then array['Team lunch with client', 'Overtime dinner allowance', 'Meals during offsite training', 'Working late meal claim']
        when 'TRAVEL' then array['Grab rides to client site', 'Parking fees for onsite meeting', 'Flight ticket for conference', 'Toll and mileage claim']
        when 'MEDICAL' then array['Clinic visit co-payment', 'Panel doctor consultation', 'Prescription medication']
        else array['Work-from-home internet reimbursement', 'Office supplies purchase', 'Mobile phone bill reimbursement']
      end;
      amount_band := case c_category when 'FOOD' then 35 when 'TRAVEL' then 80 when 'MEDICAL' then 120 else 60 end;

      insert into public.claims (
        user_id, category, amount, description, date, status, decided_by_id, decided_at, created_at
      ) values (
        emp_ids[i + 1], c_category, amount_band + ((i + j) % 5) * 15,
        descriptions[((i + j) % array_length(descriptions, 1)) + 1],
        current_date - (2 + (i + j) * 4), l_status,
        case when l_status = 'PENDING' then null else admin_id end,
        case when l_status = 'PENDING' then null else now() end,
        clock_timestamp()
      );
    end loop;
  end loop;

  -- Payslips: four months for every employee (the admin has none, as in the original).
  for i in 1 .. array_length(emp_ids, 1) loop
    salary := emp_salaries[i];
    foreach m in array months loop
      ded := round(salary * 0.115, 2);
      insert into public.payslips (user_id, month, basic_salary, allowances, deductions, net_pay)
      values (emp_ids[i], m, salary, 500, ded, round(salary + 500 - ded, 2));
    end loop;
  end loop;

  raise notice 'Seeded 1 admin + % employees, % leave requests, % claims, % payslips.',
    array_length(emp_ids, 1),
    (select count(*) from public.leave_requests),
    (select count(*) from public.claims),
    (select count(*) from public.payslips);
end;
$$;
