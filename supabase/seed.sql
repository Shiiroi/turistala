INSERT INTO public.regions (id, code, name)
OVERRIDING SYSTEM VALUE
VALUES
  (1, '10000000', 'Region I'),
  (2, '20000000', 'Region II'),
  (3, '30000000', 'Region III'),
  (4, '40000000', 'Region IV-A'),
  (5, '50000000', 'Region V'),
  (6, '60000000', 'Region VI'),
  (7, '70000000', 'Region VII'),
  (8, '80000000', 'Region VIII'),
  (9, '90000000', 'Region IX'),
  (10, '100000000', 'Region X'),
  (11, '110000000', 'Region XI'),
  (12, '120000000', 'Region XII'),
  (13, '1300000000', 'National Capital Region (NCR)'),
  (14, '140000000', 'Cordillera Administrative Region'),
  (15, '150000000', 'BARMM'),
  (16, '160000000', 'Region XIII'),
  (17, '170000000', 'Region IV-B'),
  (18, '180000000', 'Negros Island Region');

SELECT setval(pg_get_serial_sequence('public.regions', 'id'), COALESCE(max(id), 1)) FROM public.regions;

