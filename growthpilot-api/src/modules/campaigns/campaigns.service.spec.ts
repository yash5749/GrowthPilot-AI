import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../../db/prisma.service';
import { SegmentsService } from '../segments/segments.service';
import { ChannelClientService } from '../channel-client/channel-client.service';
import { buildCampaignDto } from '../../../test/helpers/factories';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: jest.Mocked<PrismaService>;
  let segmentsService: jest.Mocked<SegmentsService>;
  let channelClient: jest.Mocked<ChannelClientService>;

  const mockCampaign = {
    id: 'camp-001',
    name: 'Test Campaign',
    objective: 'Drive repeat purchases',
    segmentId: 'seg-001',
    messageTemplate: 'Hello {{name}}, check out our latest offers!',
    channel: 'email',
    status: 'draft',
    sentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    segment: { id: 'seg-001', name: 'Test Segment', ruleJson: {}, description: 'desc', aiGenerated: false, createdAt: new Date(), updatedAt: new Date() },
  };

  const mockSegment = {
    id: 'seg-001',
    name: 'Test Segment',
    description: 'desc',
    ruleJson: { city: 'New York' },
    aiGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    campaign: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    communication: {
      upsert: jest.fn(),
    },
  };

  const mockSegmentsService = {
    findOne: jest.fn(),
    preview: jest.fn(),
  };

  const mockChannelClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SegmentsService, useValue: mockSegmentsService },
        { provide: ChannelClientService, useValue: mockChannelClient },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    prisma = module.get(PrismaService);
    segmentsService = module.get(SegmentsService);
    channelClient = module.get(ChannelClientService);
  });

  describe('create', () => {
    it('creates a campaign when segment exists', async () => {
      mockSegmentsService.findOne.mockResolvedValue(mockSegment);
      mockPrisma.campaign.create.mockResolvedValue(mockCampaign);
      const dto = buildCampaignDto();

      const result = await service.create(dto);

      expect(segmentsService.findOne).toHaveBeenCalledWith(dto.segmentId);
      expect(prisma.campaign.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          objective: dto.objective,
          segmentId: dto.segmentId,
          messageTemplate: dto.messageTemplate,
          channel: dto.channel,
          status: 'draft',
        },
      });
      expect(result).toEqual(mockCampaign);
    });

    it('throws when segment does not exist', async () => {
      mockSegmentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(buildCampaignDto())).rejects.toThrow(NotFoundException);
      expect(prisma.campaign.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated campaigns with segment info', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([mockCampaign]);
      mockPrisma.campaign.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '10' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('applies search filter on campaign name', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      await service.findAll({ search: 'Test' });

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'Test', mode: 'insensitive' } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns campaign with segment', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.findOne('camp-001');

      expect(result).toEqual(mockCampaign);
    });

    it('throws on non-existent campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('approves a draft campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaign.update.mockResolvedValue({ ...mockCampaign, status: 'approved' });

      const result = await service.approve('camp-001');

      expect(prisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'approved' } }),
      );
      expect(result.status).toBe('approved');
    });

    it('rejects approving a non-draft campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'sent' });

      await expect(service.approve('camp-001')).rejects.toThrow(BadRequestException);
      expect(prisma.campaign.update).not.toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('sends an approved campaign to matching customers', async () => {
      const approvedCampaign = { ...mockCampaign, status: 'approved' };
      mockPrisma.campaign.findUnique.mockResolvedValue(approvedCampaign);
      mockSegmentsService.preview.mockResolvedValue({
        segment: mockSegment,
        count: 2,
        customers: [
          { id: 'c1', name: 'Alice', email: 'alice@example.com', phone: null, city: 'New York', createdAt: new Date() },
          { id: 'c2', name: 'Bob', email: 'bob@example.com', phone: null, city: 'Los Angeles', createdAt: new Date() },
        ],
      });
      mockPrisma.campaign.update.mockResolvedValue({ ...approvedCampaign, status: 'sent', sentAt: new Date() });
      mockPrisma.communication.upsert.mockResolvedValue({ id: 'comm-1' });
      mockChannelClient.send.mockResolvedValue(undefined);

      const result = await service.send('camp-001');

      expect(result.audienceSize).toBe(2);
      expect(prisma.communication.upsert).toHaveBeenCalledTimes(2);
      expect(channelClient.send).toHaveBeenCalledTimes(2);
    });

    it('rejects sending a draft campaign without approval', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      await expect(service.send('camp-001')).rejects.toThrow(BadRequestException);
      expect(channelClient.send).not.toHaveBeenCalled();
    });

    it('rejects sending to an empty segment', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'approved' });
      mockSegmentsService.preview.mockResolvedValue({ segment: mockSegment, count: 0, customers: [] });

      await expect(service.send('camp-001')).rejects.toThrow(BadRequestException);
      expect(prisma.communication.upsert).not.toHaveBeenCalled();
    });

    it('rejects sending an already sent campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'sent' });

      await expect(service.send('camp-001')).rejects.toThrow(BadRequestException);
    });
  });
});
