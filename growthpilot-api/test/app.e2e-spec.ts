import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/db/prisma.service';
import { CustomersRepository } from '../src/modules/customers/customers.repository';
import { OrdersRepository } from '../src/modules/orders/orders.repository';
import { AI_PROVIDER, AiProvider, SegmentSuggestion, MessageSuggestion, ChannelRecommendation, InsightSummary } from '../src/modules/ai/providers/ai-provider.interface';
import * as fs from 'fs';
import * as path from 'path';

// ─── In-memory mock database ─────────────────────────────────────────────────

const mockDb: {
  customers: Map<string, any>;
  orders: Map<string, any>;
  segments: Map<string, any>;
  campaigns: Map<string, any>;
  communications: Map<string, any>;
} = {
  customers: new Map(),
  orders: new Map(),
  segments: new Map(),
  campaigns: new Map(),
  communications: new Map(),
};

let nextId = 1;
// Generate UUID-v4-compliant IDs (13th char = '4', 17th char in '89ab')
const genId = () => {
  const n = nextId++;
  const pad = (len: number) => String(n).padStart(len, '0').slice(-len);
  return `${pad(8)}-${pad(4)}-4${pad(3)}-a${pad(3)}-${pad(12)}`;
};

// ─── Mock Prisma ────────────────────────────────────────────────────────────

const mockPrisma = {
  customer: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockImplementation(() => {
      return Array.from(mockDb.customers.values()).map((c) => ({
        ...c,
        orders: c.orders || [],
      }));
    }),
    findUnique: jest.fn().mockImplementation(({ where: { id, email } }: any) => {
      if (id) return mockDb.customers.get(id) || null;
      if (email) return Array.from(mockDb.customers.values()).find((c) => c.email === email) || null;
      return null;
    }),
    create: jest.fn().mockImplementation(({ data }: any) => {
      const customer = { id: genId(), ...data, createdAt: new Date(), updatedAt: new Date(), orders: [], _count: { orders: 0 } };
      mockDb.customers.set(customer.id, customer);
      return customer;
    }),
  },
  order: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(({ data }: any) => {
      const order = { id: genId(), ...data, createdAt: new Date() };
      mockDb.orders.set(order.id, order);
      return order;
    }),
  },
  segment: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockImplementation(({ where: { id } }: any) => mockDb.segments.get(id) || null),
    create: jest.fn().mockImplementation(({ data }: any) => {
      const segment = { id: genId(), ...data, campaigns: [], createdAt: new Date(), updatedAt: new Date() };
      mockDb.segments.set(segment.id, segment);
      return segment;
    }),
  },
  campaign: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockImplementation(({ where: { id } }: any) => {
      const c = mockDb.campaigns.get(id);
      if (!c) return null;
      return { ...c, segment: mockDb.segments.get(c.segmentId) || { id: c.segmentId, name: 'Test Segment' } };
    }),
    create: jest.fn().mockImplementation(({ data }: any) => {
      const campaign = { id: genId(), ...data, sentAt: null, communications: [], createdAt: new Date(), updatedAt: new Date() };
      mockDb.campaigns.set(campaign.id, campaign);
      return campaign;
    }),
    update: jest.fn().mockImplementation(({ where: { id }, data }: any) => {
      const existing = mockDb.campaigns.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      updated.segment = mockDb.segments.get(existing.segmentId) || updated.segment;
      mockDb.campaigns.set(id, updated);
      return updated;
    }),
  },
  communication: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockImplementation(({ where: { id } }: any) => mockDb.communications.get(id) || null),
    upsert: jest.fn().mockImplementation(({ create, update: _upd, where }: any) => {
      const existing = Array.from(mockDb.communications.values()).find(
        (c) => c.campaignId === where.campaignId_customerId.campaignId && c.customerId === where.campaignId_customerId.customerId,
      );
      if (existing) {
        const updated = { ...existing, ..._upd };
        mockDb.communications.set(existing.id, updated);
        return updated;
      }
      const comm = { id: genId(), ...create, createdAt: new Date(), updatedAt: new Date() };
      mockDb.communications.set(comm.id, comm);
      return comm;
    }),
    update: jest.fn().mockImplementation(({ where: { id }, data }: any) => {
      const existing = mockDb.communications.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      mockDb.communications.set(id, updated);
      return updated;
    }),
  },
  communicationEvent: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(({ data }: any) => {
      return { id: genId(), ...data, createdAt: new Date() };
    }),
  },
  $queryRawUnsafe: jest.fn().mockResolvedValue([{ '1': 1 }]),
};

// ─── Mock AI Provider ───────────────────────────────────────────────────────

const mockAiProvider: AiProvider = {
  generateSegment: jest.fn().mockResolvedValue({
    name: 'AI Suggested Segment',
    description: 'Suggested by AI',
    ruleJson: { totalSpent_gte: 100 },
    reason: 'Test reason',
    aiGenerated: true,
  } satisfies SegmentSuggestion),
  generateMessage: jest.fn().mockResolvedValue({
    subject: 'Exclusive offer',
    body: 'Hi {{name}}, check this out!',
    cta: 'Shop Now',
    placeholders: ['{{name}}'],
  } satisfies MessageSuggestion),
  recommendChannel: jest.fn().mockResolvedValue({
    recommendedChannel: 'email',
    reason: 'Best channel for this audience.',
  } satisfies ChannelRecommendation),
  generateInsights: jest.fn().mockResolvedValue({
    summary: 'Campaign performed well.',
    insight: 'Open rates are strong.',
    nextBestAction: 'A/B test the CTA.',
  } satisfies InsightSummary),
};

// ─── Mock repositories for CSV import ───────────────────────────────────────

const mockCustomersRepository = {
  findByEmail: jest.fn().mockImplementation(async (email: string) => {
    return Array.from(mockDb.customers.values()).find((c) => c.email === email) || null;
  }),
  findById: jest.fn().mockImplementation(async (id: string) => mockDb.customers.get(id) || null),
  findMany: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn().mockImplementation(async (data: any) => {
    const customer = { id: genId(), ...data, createdAt: new Date(), updatedAt: new Date(), orders: [], _count: { orders: 0 } };
    mockDb.customers.set(customer.id, customer);
    return customer;
  }),
};

const mockOrdersRepository = {
  create: jest.fn().mockImplementation(async (data: any) => {
    const order = { id: genId(), ...data, createdAt: new Date() };
    mockDb.orders.set(order.id, order);
    return order;
  }),
  findMany: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GrowthPilot API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    mockDb.customers.clear();
    mockDb.orders.clear();
    mockDb.segments.clear();
    mockDb.campaigns.clear();
    mockDb.communications.clear();
    nextId = 1;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(CustomersRepository)
      .useValue(mockCustomersRepository)
      .overrideProvider(OrdersRepository)
      .useValue(mockOrdersRepository)
      .overrideProvider(AI_PROVIDER)
      .useValue(mockAiProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.enableShutdownHooks();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health returns ok', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Customers', () => {
    const customerPayload = { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', city: 'New York' };

    it('POST /api/customers creates a customer', async () => {
      const res = await request(app.getHttpServer()).post('/api/customers').send(customerPayload);
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Alice Johnson');
    });

    it('POST /api/customers rejects duplicate email', async () => {
      const res = await request(app.getHttpServer()).post('/api/customers').send(customerPayload);
      expect(res.status).toBe(409);
    });

    it('GET /api/customers returns paginated list', async () => {
      const res = await request(app.getHttpServer()).get('/api/customers');
      expect(res.status).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Orders', () => {
    it('POST /api/orders/import reads CSV file', async () => {
      const csvPath = path.join(__dirname, 'fixtures/orders-valid.csv');
      const res = await request(app.getHttpServer())
        .post('/api/orders/import')
        .attach('file', fs.readFileSync(csvPath), 'orders-valid.csv');
      expect(res.status).toBe(201);
      expect(res.body.total).toBe(4);
    });
  });

  describe('Segments', () => {
    const segmentPayload = {
      name: 'NYC Shoppers',
      description: 'Customers in New York',
      ruleJson: { city: 'New York' },
    };

    it('POST /api/segments creates a segment', async () => {
      const res = await request(app.getHttpServer()).post('/api/segments').send(segmentPayload);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('NYC Shoppers');
    });

    it('GET /api/segments returns list', async () => {
      const res = await request(app.getHttpServer()).get('/api/segments');
      expect(res.status).toBe(200);
    });

    it('POST /api/segments/ai-suggest uses AI', async () => {
      const res = await request(app.getHttpServer()).post('/api/segments/ai-suggest').send({ businessGoal: 'Find VIP customers' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('AI Suggested Segment');
    });
  });

  describe('Campaigns', () => {
    let segmentId: string;

    beforeEach(async () => {
      const segRes = await request(app.getHttpServer()).post('/api/segments').send({
        name: 'Test Segment',
        ruleJson: { city: 'New York' },
      });
      segmentId = segRes.body.id;
    });

    it('POST /api/campaigns creates a draft campaign', async () => {
      const res = await request(app.getHttpServer()).post('/api/campaigns').send({
        name: 'Test Campaign',
        objective: 'Drive repeat purchases',
        segmentId,
        messageTemplate: 'Hello {{name}}!',
        channel: 'email',
      });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('draft');
    });

    it('full flow: create → approve → send campaign', async () => {
      // Create campaign
      const createRes = await request(app.getHttpServer()).post('/api/campaigns').send({
        name: 'Full Flow Campaign',
        objective: 'Drive repeat purchases',
        segmentId,
        messageTemplate: 'Hi {{name}}, shop now!',
        channel: 'email',
      });
      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe('draft');
      const campaignId = createRes.body.id;

      // Approve
      const approveRes = await request(app.getHttpServer()).post(`/api/campaigns/${campaignId}/approve`);
      expect(approveRes.status).toBe(201);
      expect(approveRes.body.status).toBe('approved');

      // Send
      const sendRes = await request(app.getHttpServer()).post(`/api/campaigns/${campaignId}/send`);
      expect(sendRes.status).toBe(201);
      expect(sendRes.body.campaign.status).toBe('sent');
    });
  });

  describe('Communications', () => {
    it('GET /api/communications returns paginated list', async () => {
      const res = await request(app.getHttpServer()).get('/api/communications');
      expect(res.status).toBe(200);
    });
  });

  describe('Analytics', () => {
    it('GET /api/analytics/dashboard returns metrics', async () => {
      const res = await request(app.getHttpServer()).get('/api/analytics/dashboard');
      expect(res.status).toBe(200);
      expect(res.body.totalCustomers).toBeDefined();
      expect(res.body.rates).toBeDefined();
    });
  });

  describe('AI endpoints', () => {
    it('POST /api/ai/segment suggests a segment', async () => {
      const res = await request(app.getHttpServer()).post('/api/ai/segment').send({ businessGoal: 'Find high-value customers' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBeDefined();
    });

    it('POST /api/ai/message generates a message', async () => {
      const res = await request(app.getHttpServer()).post('/api/ai/message').send({
        segmentName: 'VIP',
        channel: 'email',
        objective: 'Drive sales',
      });
      expect(res.status).toBe(201);
      expect(res.body.body).toContain('{{name}}');
    });

    it('POST /api/ai/recommend-channel returns recommendation', async () => {
      const res = await request(app.getHttpServer()).post('/api/ai/recommend-channel').send({
        segmentName: 'Test',
        objective: 'Drive sales',
      });
      expect(res.status).toBe(201);
      expect(res.body.recommendedChannel).toBeDefined();
    });
  });
});
