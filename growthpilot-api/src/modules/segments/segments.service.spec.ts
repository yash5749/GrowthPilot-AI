import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { PrismaService } from '../../db/prisma.service';
import { AiService } from '../ai/ai.service';
import { buildSegmentDto } from '../../../test/helpers/factories';

describe('SegmentsService', () => {
  let service: SegmentsService;
  let prisma: jest.Mocked<PrismaService>;
  let aiService: jest.Mocked<AiService>;

  const mockSegment = {
    id: 'seg-001',
    name: 'Test Segment',
    description: 'A test segment',
    ruleJson: { city: 'New York', orderCount_gte: 1 },
    aiGenerated: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    campaigns: [],
  };

  const mockPrisma = {
    segment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
  };

  const mockAiService = {
    suggestSegment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SegmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<SegmentsService>(SegmentsService);
    prisma = module.get(PrismaService);
    aiService = module.get(AiService);
  });

  describe('create', () => {
    it('creates a segment with given data', async () => {
      mockPrisma.segment.create.mockResolvedValue(mockSegment);
      const dto = buildSegmentDto();

      const result = await service.create(dto);

      expect(prisma.segment.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          ruleJson: dto.ruleJson,
          aiGenerated: false,
        },
      });
      expect(result).toEqual(mockSegment);
    });
  });

  describe('findAll', () => {
    it('returns paginated segments', async () => {
      mockPrisma.segment.findMany.mockResolvedValue([mockSegment]);
      mockPrisma.segment.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '10' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('applies search filter', async () => {
      mockPrisma.segment.findMany.mockResolvedValue([]);
      mockPrisma.segment.count.mockResolvedValue(0);

      await service.findAll({ search: 'VIP' });

      expect(prisma.segment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'VIP', mode: 'insensitive' } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a segment by id', async () => {
      mockPrisma.segment.findUnique.mockResolvedValue(mockSegment);

      const result = await service.findOne('seg-001');

      expect(result).toEqual(mockSegment);
    });

    it('throws on non-existent segment', async () => {
      mockPrisma.segment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('preview', () => {
    it('returns matching customers for rule-based segment', async () => {
      mockPrisma.segment.findUnique.mockResolvedValue(mockSegment);
      mockPrisma.customer.findMany.mockResolvedValue([
        {
          id: 'c1',
          name: 'Alice',
          email: 'alice@example.com',
          phone: null,
          city: 'New York',
          createdAt: new Date(),
          orders: [
            { id: 'o1', orderTotal: 100, orderedAt: new Date(), status: 'completed' },
          ],
        },
        {
          id: 'c2',
          name: 'Bob',
          email: 'bob@example.com',
          phone: null,
          city: 'Los Angeles',
          createdAt: new Date(),
          orders: [
            { id: 'o2', orderTotal: 50, orderedAt: new Date(), status: 'completed' },
          ],
        },
      ]);

      const result = await service.preview('seg-001');

      // Only Alice matches (city = New York AND orderCount_gte = 1)
      expect(result.count).toBe(1);
      expect(result.customers[0].email).toBe('alice@example.com');
    });

    it('returns empty result when no customers match', async () => {
      mockPrisma.segment.findUnique.mockResolvedValue(mockSegment);
      mockPrisma.customer.findMany.mockResolvedValue([]);

      const result = await service.preview('seg-001');

      expect(result.count).toBe(0);
      expect(result.customers).toHaveLength(0);
    });
  });

  describe('aiSuggest', () => {
    it('delegates to AiService.suggestSegment', async () => {
      const suggestion = {
        name: 'VIP Customers',
        description: 'High-value customers',
        ruleJson: { totalSpent_gte: 500 },
        reason: 'High spenders are worth targeting',
        aiGenerated: true,
      };
      mockAiService.suggestSegment.mockResolvedValue(suggestion);

      const result = await service.aiSuggest('Find VIP customers');

      expect(aiService.suggestSegment).toHaveBeenCalledWith({ businessGoal: 'Find VIP customers' });
      expect(result).toEqual(suggestion);
    });
  });
});
