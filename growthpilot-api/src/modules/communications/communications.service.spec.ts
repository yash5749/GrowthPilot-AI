import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { PrismaService } from '../../db/prisma.service';
import { CallbackEventType } from './dto/channel-event.dto';
import { buildCallbackDto, buildMockCommunication } from '../../../test/helpers/factories';

describe('CommunicationsService', () => {
  let service: CommunicationsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    communication: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    communicationEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CommunicationsService>(CommunicationsService);
    prisma = module.get(PrismaService);
  });

  describe('handleCallback', () => {
    it('updates status when event moves communication forward', async () => {
      const comm = buildMockCommunication({ status: 'delivered' });
      mockPrisma.communication.findUnique.mockResolvedValue(comm);
      mockPrisma.communicationEvent.findFirst.mockResolvedValue(null);
      mockPrisma.communicationEvent.create.mockResolvedValue({ id: 'evt-1' });
      mockPrisma.communication.update.mockResolvedValue({ ...comm, status: 'opened', openedAt: new Date() });

      const dto = buildCallbackDto(comm.id, CallbackEventType.OPENED);
      await service.handleCallback(dto);

      expect(prisma.communicationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'opened' }),
        }),
      );
      expect(prisma.communication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: comm.id },
          data: expect.objectContaining({ status: 'opened', openedAt: expect.any(Date) }),
        }),
      );
    });

    it('rejects callback for non-existent communication', async () => {
      mockPrisma.communication.findUnique.mockResolvedValue(null);

      const dto = buildCallbackDto('nonexistent', CallbackEventType.DELIVERED);
      await expect(service.handleCallback(dto)).rejects.toThrow(NotFoundException);
    });

    it('is idempotent for duplicate events', async () => {
      // openedAt is already set, so the timestamp backfill will not trigger
      const comm = buildMockCommunication({
        status: 'opened',
        openedAt: new Date('2026-06-01T10:05:00Z'),
      });
      mockPrisma.communication.findUnique.mockResolvedValue(comm);
      // Simulate duplicate: same event already exists in event log
      mockPrisma.communicationEvent.findFirst.mockResolvedValue({ id: 'existing-event' });

      const dto = buildCallbackDto(comm.id, CallbackEventType.OPENED);
      await service.handleCallback(dto);

      // Should NOT create a duplicate event log entry
      expect(prisma.communicationEvent.create).not.toHaveBeenCalled();
      // Should NOT update the communication (status same weight, timestamps already set)
      expect(prisma.communication.update).not.toHaveBeenCalled();
    });

    it('handles out-of-order callbacks correctly', async () => {
      // Communication is already at "clicked", but we receive an "opened" callback late
      const comm = buildMockCommunication({ status: 'clicked' });
      mockPrisma.communication.findUnique.mockResolvedValue(comm);
      mockPrisma.communicationEvent.findFirst.mockResolvedValue(null);
      mockPrisma.communicationEvent.create.mockResolvedValue({ id: 'evt-1' });

      const dto = buildCallbackDto(comm.id, CallbackEventType.OPENED);
      await service.handleCallback(dto);

      // Event should be logged (no duplication check issue)
      expect(prisma.communicationEvent.create).toHaveBeenCalled();
      // Status should NOT be downgraded from "clicked" to "opened"
      expect(prisma.communication.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'opened' }),
        }),
      );
    });

    it('records failure reason on FAILED event', async () => {
      const comm = buildMockCommunication({ status: 'sent', failureReason: null });
      mockPrisma.communication.findUnique.mockResolvedValue(comm);
      mockPrisma.communicationEvent.findFirst.mockResolvedValue(null);
      mockPrisma.communicationEvent.create.mockResolvedValue({ id: 'evt-1' });

      const dto = buildCallbackDto(comm.id, CallbackEventType.FAILED, {
        failureReason: 'Carrier error: number unreachable',
      });
      await service.handleCallback(dto);

      expect(prisma.communication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
            failureReason: 'Carrier error: number unreachable',
          }),
        }),
      );
    });

    it('logs purchased event with timestamp', async () => {
      // sentAt and deliveredAt are already set on the mock comm;
      // openedAt/readAt/clickedAt/purchasedAt are null and will be backfilled
      const comm = buildMockCommunication({ status: 'clicked' });
      mockPrisma.communication.findUnique.mockResolvedValue(comm);
      mockPrisma.communicationEvent.findFirst.mockResolvedValue(null);
      mockPrisma.communicationEvent.create.mockResolvedValue({ id: 'evt-1' });

      const dto = buildCallbackDto(comm.id, CallbackEventType.PURCHASED);
      await service.handleCallback(dto);

      expect(prisma.communication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'purchased',
            openedAt: expect.any(Date),
            readAt: expect.any(Date),
            clickedAt: expect.any(Date),
            purchasedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('findByCampaign', () => {
    it('returns paginated communications for a campaign', async () => {
      const comm = buildMockCommunication();
      mockPrisma.communication.findMany.mockResolvedValue([comm]);
      mockPrisma.communication.count.mockResolvedValue(1);

      const result = await service.findByCampaign('camp-001', { page: '1', limit: '10' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findAll', () => {
    it('returns paginated communications across all campaigns', async () => {
      const comm = buildMockCommunication();
      mockPrisma.communication.findMany.mockResolvedValue([comm]);
      mockPrisma.communication.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '20' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
