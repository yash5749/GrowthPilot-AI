import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../db/prisma.service';
import { buildMockCommunication } from '../../../test/helpers/factories';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    customer: { count: jest.fn() },
    order: { count: jest.fn() },
    segment: { count: jest.fn() },
    campaign: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    communication: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);
  });

  describe('getDashboardAnalytics', () => {
    it('returns aggregate metrics', async () => {
      mockPrisma.customer.count.mockResolvedValue(10);
      mockPrisma.order.count.mockResolvedValue(25);
      mockPrisma.segment.count.mockResolvedValue(3);
      mockPrisma.campaign.count.mockResolvedValue(2);
      mockPrisma.communication.findMany.mockResolvedValue([
        buildMockCommunication({ status: 'delivered' }),
        buildMockCommunication({ status: 'opened', openedAt: new Date(), readAt: null, clickedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ status: 'purchased', openedAt: new Date(), readAt: new Date(), clickedAt: new Date(), purchasedAt: new Date(), sentAt: new Date('2026-06-01T10:00:00Z'), customer: { orders: [{ orderTotal: 149.99, orderedAt: new Date('2026-06-02T10:00:00Z'), status: 'completed' }] } }),
      ]);

      const result = await service.getDashboardAnalytics();

      expect(result.totalCustomers).toBe(10);
      expect(result.totalOrders).toBe(25);
      expect(result.activeSegments).toBe(3);
      expect(result.campaignsSent).toBe(2);
      expect(result.aggregateCounters.sentCount).toBe(3);
      expect(result.aggregateCounters.deliveredCount).toBe(3);
      expect(result.aggregateCounters.failedCount).toBe(0);
      expect(result.aggregateCounters.openedCount).toBe(2);
      expect(result.aggregateCounters.purchasedCount).toBe(1);
    });

    it('calculates rates correctly', async () => {
      mockPrisma.customer.count.mockResolvedValue(0);
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.segment.count.mockResolvedValue(0);
      mockPrisma.campaign.count.mockResolvedValue(0);
      // 5 sent, 5 delivered (delivered/opened/purchased all count as delivered), 2 opened, 1 purchased
      mockPrisma.communication.findMany.mockResolvedValue([
        buildMockCommunication({ id: 'c1', status: 'sent', sentAt: new Date(), deliveredAt: null, openedAt: null, readAt: null, clickedAt: null, purchasedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ id: 'c2', status: 'delivered', sentAt: new Date(), deliveredAt: new Date(), openedAt: null, readAt: null, clickedAt: null, purchasedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ id: 'c3', status: 'delivered', sentAt: new Date(), deliveredAt: new Date(), openedAt: null, readAt: null, clickedAt: null, purchasedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ id: 'c4', status: 'opened', sentAt: new Date(), deliveredAt: new Date(), openedAt: new Date(), readAt: null, clickedAt: null, purchasedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ id: 'c5', status: 'purchased', sentAt: new Date(), deliveredAt: new Date(), openedAt: new Date(), readAt: new Date(), clickedAt: new Date(), purchasedAt: new Date(), customer: { orders: [{ orderTotal: 99.99, orderedAt: new Date(), status: 'completed' }] } }),
      ]);

      const result = await service.getDashboardAnalytics();

      expect(result.aggregateCounters.sentCount).toBe(5);
      expect(result.aggregateCounters.deliveredCount).toBe(4);
      expect(result.rates.deliveryRate).toBe(4 / 5);
      // openedAt set on c4 (opened) and c5 (purchased) = 2 opened out of 4 delivered
      expect(result.rates.openRate).toBe(2 / 4);
      expect(result.rates.conversionRate).toBe(1 / 5);
      expect(result.revenueAttributed).toBe(99.99);
    });

    it('returns zero rates when no communications exist', async () => {
      mockPrisma.customer.count.mockResolvedValue(0);
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.segment.count.mockResolvedValue(0);
      mockPrisma.campaign.count.mockResolvedValue(0);
      mockPrisma.communication.findMany.mockResolvedValue([]);

      const result = await service.getDashboardAnalytics();

      expect(result.rates.deliveryRate).toBe(0);
      expect(result.rates.openRate).toBe(0);
      expect(result.rates.conversionRate).toBe(0);
    });
  });

  describe('getCampaignAnalytics', () => {
    const mockCampaign = {
      id: 'camp-001',
      name: 'Test Campaign',
      objective: 'Drive repeat purchases',
      status: 'sent',
      segmentId: 'seg-001',
      messageTemplate: 'Hello!',
      channel: 'email',
      sentAt: new Date('2026-06-01T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('returns funnel counts for a campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.communication.findMany.mockResolvedValue([
        buildMockCommunication({ id: 'c1', status: 'delivered', openedAt: null, readAt: null, clickedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ id: 'c2', status: 'opened', openedAt: new Date(), readAt: null, clickedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ id: 'c3', status: 'purchased', sentAt: new Date('2026-06-01T10:00:00Z'), openedAt: new Date(), readAt: new Date(), clickedAt: new Date(), purchasedAt: new Date(), customer: { orders: [{ orderTotal: 149.99, orderedAt: new Date('2026-06-02T10:00:00Z'), status: 'completed' }] } }),
        buildMockCommunication({ id: 'c4', status: 'failed', failureReason: 'error', customer: { orders: [] } }),
      ]);

      const result = await service.getCampaignAnalytics('camp-001');

      expect(result.campaignName).toBe('Test Campaign');
      expect(result.audienceSize).toBe(4);
      // delivered, opened, purchased all count as sent
      expect(result.sentCount).toBe(3);
      // delivered, opened, purchased all count as delivered
      expect(result.deliveredCount).toBe(3);
      expect(result.failedCount).toBe(1);
      // openedAt set on c2 and c3
      expect(result.openedCount).toBe(2);
      expect(result.purchasedCount).toBe(1);
      expect(result.revenueAttributed).toBe(149.99);
    });

    it('returns zero rates when no communications progressed', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.communication.findMany.mockResolvedValue([
        buildMockCommunication({ id: 'c1', status: 'pending', sentAt: null, deliveredAt: null, openedAt: null, customer: { orders: [] } }),
      ]);

      const result = await service.getCampaignAnalytics('camp-001');

      expect(result.sentCount).toBe(0);
      expect(result.deliveredCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.rates.deliveryRate).toBe(0);
      expect(result.rates.conversionRate).toBe(0);
    });

    it('throws on non-existent campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.getCampaignAnalytics('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('attributes revenue only for orders after campaign send time', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.communication.findMany.mockResolvedValue([
        buildMockCommunication({
          id: 'c1', status: 'purchased',
          sentAt: new Date('2026-06-01T10:00:00Z'),
          openedAt: new Date(),
          readAt: new Date(),
          clickedAt: new Date(),
          purchasedAt: new Date(),
          customer: {
            orders: [
              { orderTotal: 50, orderedAt: new Date('2026-05-01T10:00:00Z'), status: 'completed' }, // before campaign – excluded
              { orderTotal: 200, orderedAt: new Date('2026-06-05T10:00:00Z'), status: 'completed' }, // after campaign – included
            ],
          },
        }),
      ]);

      const result = await service.getCampaignAnalytics('camp-001');

      expect(result.revenueAttributed).toBe(200);
    });

    it('correctly computes read and click counts', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.communication.findMany.mockResolvedValue([
        buildMockCommunication({ id: 'c1', status: 'read', openedAt: new Date(), readAt: new Date(), clickedAt: null, customer: { orders: [] } }),
        buildMockCommunication({ id: 'c2', status: 'clicked', openedAt: new Date(), readAt: new Date(), clickedAt: new Date(), customer: { orders: [] } }),
        buildMockCommunication({ id: 'c3', status: 'opened', openedAt: new Date(), readAt: null, clickedAt: null, customer: { orders: [] } }),
      ]);

      const result = await service.getCampaignAnalytics('camp-001');

      expect(result.openedCount).toBe(3);
      expect(result.readCount).toBe(2);
      expect(result.clickedCount).toBe(1);
    });
  });
});