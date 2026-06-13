import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../../db/prisma.service';
import { AI_PROVIDER, AiProvider, SegmentSuggestion, MessageSuggestion, ChannelRecommendation, InsightSummary } from './providers/ai-provider.interface';

describe('AiService', () => {
  let service: AiService;
  let provider: jest.Mocked<AiProvider>;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    customer: { count: jest.fn(), findMany: jest.fn() },
    order: { findMany: jest.fn() },
    campaign: { findUnique: jest.fn() },
    communication: { findMany: jest.fn() },
  };

  const mockSegmentSuggestion: SegmentSuggestion = {
    name: 'High Value Customers',
    description: 'Customers with high spend',
    ruleJson: { totalSpent_gte: 500 },
    reason: 'These customers drive the most revenue.',
    aiGenerated: true,
  };

  const mockMessageSuggestion: MessageSuggestion = {
    subject: 'Exclusive offer for you',
    body: 'Hi {{name}}, check this out!',
    cta: 'Shop Now',
    placeholders: ['{{name}}', '{{email}}'],
  };

  const mockChannelRecommendation: ChannelRecommendation = {
    recommendedChannel: 'whatsapp',
    reason: 'WhatsApp has the highest open rates.',
  };

  const mockInsightSummary: InsightSummary = {
    summary: 'Campaign performed well.',
    insight: 'Open rates are strong.',
    nextBestAction: 'Try A/B testing the CTA.',
  };

  const mockProvider: jest.Mocked<AiProvider> = {
    generateSegment: jest.fn().mockResolvedValue(mockSegmentSuggestion),
    generateMessage: jest.fn().mockResolvedValue(mockMessageSuggestion),
    recommendChannel: jest.fn().mockResolvedValue(mockChannelRecommendation),
    generateInsights: jest.fn().mockResolvedValue(mockInsightSummary),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: AI_PROVIDER, useValue: mockProvider },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    provider = module.get(AI_PROVIDER);
    prisma = module.get(PrismaService);
  });

  describe('suggestSegment', () => {
    it('returns segment suggestion enriched with live customer data', async () => {
      mockPrisma.customer.count.mockResolvedValue(50);
      mockPrisma.order.findMany.mockResolvedValue([
        { orderTotal: 100 }, { orderTotal: 200 }, { orderTotal: 300 },
      ]);
      mockPrisma.customer.findMany.mockResolvedValue([
        { city: 'New York' }, { city: 'New York' }, { city: 'Los Angeles' },
      ]);

      const result = await service.suggestSegment({ businessGoal: 'Find high-value customers' });

      expect(provider.generateSegment).toHaveBeenCalledWith(
        expect.objectContaining({
          businessGoal: 'Find high-value customers',
          customerSummary: expect.objectContaining({
            totalCustomers: 50,
            avgOrderValue: 200,
          }),
        }),
      );
      expect(result).toEqual(mockSegmentSuggestion);
    });

    it('passes through customer summary if provided', async () => {
      const summary = { totalCustomers: 10, avgOrderValue: 150, topCities: ['Boston'] };
      mockPrisma.customer.count.mockResolvedValue(50);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await service.suggestSegment({ businessGoal: 'Test', customerSummary: summary });

      expect(provider.generateSegment).toHaveBeenCalledWith(
        expect.objectContaining({ customerSummary: summary }),
      );
    });
  });

  describe('generateMessage', () => {
    it('returns message suggestion from provider', async () => {
      const result = await service.generateMessage({
        segmentName: 'VIP',
        channel: 'email',
        objective: 'Drive sales',
      });

      expect(provider.generateMessage).toHaveBeenCalledWith({
        segmentName: 'VIP',
        channel: 'email',
        objective: 'Drive sales',
      });
      expect(result).toEqual(mockMessageSuggestion);
    });
  });

  describe('recommendChannel', () => {
    it('returns channel recommendation from provider', async () => {
      const result = await service.recommendChannel({
        segmentName: 'Test',
        objective: 'Drive sales',
      });

      expect(provider.recommendChannel).toHaveBeenCalled();
      expect(result).toEqual(mockChannelRecommendation);
    });
  });

  describe('generateInsights', () => {
    it('computes analytics from DB and returns AI insight', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({
        id: 'camp-001',
        name: 'Test Campaign',
        objective: 'Drive sales',
        status: 'sent',
        segmentId: 'seg-001',
        messageTemplate: 'Hello!',
        channel: 'email',
        sentAt: new Date('2026-06-01T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.communication.findMany.mockResolvedValue([
        {
          id: 'c1', communicationId: 'c1', campaignId: 'camp-001', customerId: 'cust-1',
          status: 'purchased', sentAt: new Date('2026-06-01T10:00:00Z'), purchasedAt: new Date(),
          channel: 'email', messageRendered: 'Hello', failureReason: null,
          createdAt: new Date(), updatedAt: new Date(),
          deliveredAt: new Date(), openedAt: new Date(), readAt: new Date(), clickedAt: new Date(),
        },
      ]);
      mockPrisma.order.findMany.mockResolvedValue([{ orderTotal: 149.99 }]);

      const result = await service.generateInsights({ campaignId: 'camp-001' });

      expect(provider.generateInsights).toHaveBeenCalled();
      expect(result).toEqual(mockInsightSummary);
    });

    it('throws on non-existent campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.generateInsights({ campaignId: 'nonexistent' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('provider integration', () => {
    it('uses the provider injected via AI_PROVIDER token', () => {
      expect(provider).toBeDefined();
      expect(typeof provider.generateSegment).toBe('function');
      expect(typeof provider.generateMessage).toBe('function');
      expect(typeof provider.recommendChannel).toBe('function');
      expect(typeof provider.generateInsights).toBe('function');
    });

    it('handles malformed provider response gracefully', async () => {
      mockProvider.generateSegment.mockRejectedValue(new Error('Invalid JSON response from AI provider'));
      mockPrisma.customer.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.customer.findMany.mockResolvedValue([]);

      await expect(
        service.suggestSegment({ businessGoal: 'Test' }),
      ).rejects.toThrow('Invalid JSON response from AI provider');
    });
  });
});
