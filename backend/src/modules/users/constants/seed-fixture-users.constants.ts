// Keep these keys stable: existing demo records and other modules reference them.
const USER_KEYS = [
  'record-01971',
  'record-02047',
  'record-01122',
  'record-01880',
  'record-02303',
  'record-01108',
  'record-00242',
  'record-02874',
  'record-02069',
  'record-00715',
  'record-01645',
  'record-00357',
  'record-00979',
  'record-03051',
  'record-01197',
  'record-02670',
  'record-02601',
  'record-03450',
  'record-03151',
  'record-03432',
  'record-02893',
  'record-02931',
  'record-00602',
  'record-02703',
  'record-00295',
  'record-00508',
  'record-02953',
  'record-03323',
  'record-02750',
  'record-00191',
  'record-03502',
  'record-01962',
  'record-01403',
  'record-00241',
  'record-00283',
  'record-00412',
  'record-00122',
  'record-02093',
  'record-01983',
  'record-02511',
  'record-00524',
  'record-00404',
  'record-01608',
  'record-03381',
  'record-00334',
  'record-00205',
  'record-03389',
  'record-03305',
  'record-00549',
  'record-00435',
] as const;
const FIRST_NAMES = [
  'Alina',
  'Bruno',
  'Celia',
  'Dante',
  'Elena',
  'Fabio',
  'Gala',
  'Hugo',
  'Iria',
  'Joel',
  'Kira',
  'Leo',
  'Mara',
  'Nilo',
  'Olga',
  'Pablo',
  'Rina',
  'Saul',
  'Talia',
  'Uriel',
  'Vera',
  'Waldo',
  'Xenia',
  'Yago',
  'Zara',
];
const LAST_NAMES = [
  'Valle Demo',
  'Nube Demo',
  'Prisma Demo',
  'Vector Demo',
  'Aurora Demo',
  'Horizonte Demo',
  'Circuito Demo',
  'Nodo Demo',
  'Bit Demo',
  'Algoritmo Demo',
];
export const FIXTURE_TECHNICAL_AREAS = [
  'Backend',
  'Desarrollo Web',
  'Bases de Datos',
  'QA',
  'Datos',
  'Cloud',
  'Redes',
  'Arquitectura',
];
const CITIES = [
  'Seed: Valle Claro',
  'Seed: Puerto Nube',
  'Seed: Villa Algoritmo',
  'Seed: Ciudad Binaria',
  'Seed: Sierra Digital',
];

export const FIXTURE_USERS = USER_KEYS.map((key, index) => {
  const roles =
    index < 20
      ? ['estudiante']
      : index < 42
        ? ['titulado']
        : index < 46
          ? ['mentor']
          : ['empresa'];
  if ((index >= 12 && index < 20) || (index >= 32 && index < 42))
    roles.push('mentor');
  return {
    key,
    number: index + 1,
    firstName: FIRST_NAMES[index % FIRST_NAMES.length],
    lastName: LAST_NAMES[index % LAST_NAMES.length],
    city: CITIES[index % CITIES.length],
    interest: FIXTURE_TECHNICAL_AREAS[index % FIXTURE_TECHNICAL_AREAS.length],
    isActive: ![11, 31, 49].includes(index),
    roles,
  };
});

export const FIXTURE_MENTORS = FIXTURE_USERS.filter((user) =>
  user.roles.includes('mentor'),
);
