import { afterEach, describe, expect, it, vi } from 'vitest';

const seedUsers = vi.fn();
const seedAvailability = vi.fn();
const seedAccessRequests = vi.fn();
const seedEvents = vi.fn();
const seedEventRegistrations = vi.fn();
const seedTechnicalAreas = vi.fn();
const seedOrientationTypes = vi.fn();
const seedJobOffers = vi.fn();
const seedChat = vi.fn();

vi.mock('../../modules/users/seeds/users.seed.js', () => ({
  hashSeedPassword: vi.fn().mockResolvedValue('hash'),
  seedUsers: (...args: unknown[]) => seedUsers(...args),
}));
vi.mock('../../modules/availability/seeds/availability.seed.js', () => ({
  seedAvailability: (...args: unknown[]) => seedAvailability(...args),
}));
vi.mock('../../modules/access-requests/seeds/access-requests.seed.js', () => ({
  seedAccessRequests: (...args: unknown[]) => seedAccessRequests(...args),
}));
vi.mock('../../modules/events/seeds/events.seed.js', () => ({
  seedEvents: (...args: unknown[]) => seedEvents(...args),
}));
vi.mock(
  '../../modules/event-registrations/seeds/event-registrations.seed.js',
  () => ({
    seedEventRegistrations: (...args: unknown[]) =>
      seedEventRegistrations(...args),
  }),
);
vi.mock('../../modules/technical-areas/seeds/technical-areas.seed.js', () => ({
  seedTechnicalAreas: (...args: unknown[]) => seedTechnicalAreas(...args),
}));
vi.mock(
  '../../modules/orientation-types/seeds/orientation-types.seed.js',
  () => ({
    seedOrientationTypes: (...args: unknown[]) => seedOrientationTypes(...args),
  }),
);
vi.mock('../../modules/job-offers/seeds/job-offers.seed.js', () => ({
  seedJobOffers: (...args: unknown[]) => seedJobOffers(...args),
}));
vi.mock('../../modules/chat/seeds/chat.seed.js', () => ({
  seedChat: (...args: unknown[]) => seedChat(...args),
}));

const { runSeed } = await import('../database/seeds.js');

function setupSeeds() {
  const user = (id: string) => ({ id });
  seedUsers.mockResolvedValue({
    users: {
      eventGraduate: user('e1'),
      emptyGraduate: user('e2'),
      mentorA: user('m1'),
      mentorB: user('m2'),
      graduate: user('g1'),
      student: user('s1'),
      admin: user('a1'),
    },
    roles: 5,
    userRoles: 7,
    legacyRoles: 0,
  });
  seedAvailability.mockResolvedValue({
    weeks: {},
    plan: {},
    statuses: 2,
    blocks: 56,
    appointments: 2,
    warnings: ['aviso'],
  });
  seedAccessRequests.mockResolvedValue({
    statuses: 5,
    documentTypes: 2,
    careers: 2,
  });
  seedChat.mockResolvedValue({
    messageStatuses: 4,
    userPresences: 6,
    conversations: 5,
    messages: 11,
  });
}

describe('runSeed', () => {
  afterEach(() => vi.clearAllMocks());

  it('ejecuta los seeds en orden con una transacción por módulo y arma el resumen', async () => {
    setupSeeds();
    const tx = {};
    const client = {
      $transaction: vi.fn().mockImplementation(async (fn) => fn(tx)),
      $disconnect: vi.fn(),
    };

    const summary = await runSeed(client as never);

    expect(client.$transaction).toHaveBeenCalledTimes(9);
    expect(seedTechnicalAreas).toHaveBeenCalledWith(tx);
    expect(seedOrientationTypes).toHaveBeenCalledWith(tx);
    expect(seedJobOffers).toHaveBeenCalledWith(tx);
    expect(seedUsers).toHaveBeenCalledWith(tx, 'hash');
    expect(seedEvents).toHaveBeenCalledWith(tx, 'e1');
    expect(seedEventRegistrations).toHaveBeenCalledWith(tx, 'e1');
    expect(seedAvailability).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ mentorId: 'm1', graduateId: 'g1' }),
      expect.any(Date),
    );
    expect(seedAccessRequests).toHaveBeenCalledWith(tx);
    expect(seedChat).toHaveBeenCalledWith(tx);
    expect(summary).toMatchObject({
      roles: 5,
      statuses: 2,
      users: 11,
      userRoles: 7,
      blocks: 56,
      appointments: 2,
      warnings: ['aviso'],
      accessRequests: { statuses: 5, documentTypes: 2, careers: 2 },
    });
    expect(client.$disconnect).not.toHaveBeenCalled();
  });
});
