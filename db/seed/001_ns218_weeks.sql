insert into public.weeks (course_code, week_index, title, act, start_date, is_exam_week, published)
values
  ('NS218', 1, 'Intermolecular interactions I: probabilities, entropy, Coulomb', 'Act I', '2026-02-16', false, true),
  ('NS218', 2, 'Intermolecular interactions II: dipoles, polarizability, vdW', 'Act I', '2026-02-23', false, true),
  ('NS218', 3, 'Intermolecular interactions III: long-range weakening and thermal scale', 'Act I', '2026-03-02', false, true),
  ('NS218', 4, 'Surfaces I: radial distribution and potential of mean force', 'Act II', '2026-03-09', false, true),
  ('NS218', 5, 'Surfaces II: SFA/AFM, Hamaker constants', 'Act II', '2026-03-16', false, true),
  ('NS218', 6, 'Surfaces III: ionic shielding, Debye/Bjerrum lengths', 'Act II', '2026-03-23', false, true),
  ('NS218', 7, 'Exam I', 'Exam', '2026-03-31', true, true),
  ('NS218', 8, 'Interactions to binding I: kinetics and temperature effects', 'Act III', '2026-04-06', false, true),
  ('NS218', 9, 'Interactions to binding II: random walk, diffusion, Langevin', 'Act III', '2026-04-13', false, true),
  ('NS218', 10, 'Interactions to binding III: Langmuir and Michaelis-Menten', 'Act III', '2026-04-20', false, true),
  ('NS218', 11, 'Cooperative systems I: cooperative binding and self-assembly', 'Act IV', '2026-04-27', false, true),
  ('NS218', 12, 'Cooperative systems II: amphiphiles and biological machines', 'Act IV', '2026-05-04', false, true),
  ('NS218', 13, 'Exam II', 'Exam', '2026-05-12', true, true),
  ('NS218', 14, 'Nano time and length scales, course synthesis', 'Finale', '2026-05-18', false, true)
on conflict (course_code, week_index) do nothing;
