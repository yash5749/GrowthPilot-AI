import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { ChannelEventDto, CallbackEventType } from './dto/channel-event.dto';
import { buildPagination, paginatedResult } from '../../common/helpers/pagination.helper';

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  failed: 2,
  opened: 3,
  read: 4,
  clicked: 5,
  purchased: 6,
};

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleCallback(dto: ChannelEventDto) {
    const { communicationId, eventType, timestamp, failureReason } = dto;
    const eventTime = new Date(timestamp);

    // 1. Fetch communication record
    const comm = await this.prisma.communication.findUnique({
      where: { id: communicationId },
    });

    if (!comm) {
      this.logger.error(`Callback received for non-existent communication ID: ${communicationId}`);
      throw new NotFoundException(`Communication with ID ${communicationId} not found`);
    }

    this.logger.log(
      `Received callback [${eventType}] for comm ID ${communicationId}. Current status: ${comm.status}`,
    );

    // 2. Add event to event log idempotently
    const existingEvent = await this.prisma.communicationEvent.findFirst({
      where: {
        communicationId,
        eventType,
      },
    });

    if (!existingEvent) {
      await this.prisma.communicationEvent.create({
        data: {
          communicationId,
          eventType,
          payloadJson: { timestamp, failureReason } as any,
          createdAt: eventTime,
        },
      });
    }

    // 3. Determine if we should update status based on order hierarchy
    const currentWeight = STATUS_ORDER[comm.status] ?? 0;
    const incomingWeight = STATUS_ORDER[eventType] ?? 0;

    const shouldUpdateStatus = incomingWeight > currentWeight;

    // Build update payload
    const updateData: any = {};

    if (shouldUpdateStatus) {
      updateData.status = eventType;
    }

    // Set timestamps. Backfill earlier timestamps that are null.
    if (eventType === CallbackEventType.SENT || incomingWeight > STATUS_ORDER.sent) {
      if (!comm.sentAt) updateData.sentAt = eventTime;
    }
    if (eventType === CallbackEventType.DELIVERED || incomingWeight > STATUS_ORDER.delivered) {
      if (!comm.deliveredAt && eventType !== CallbackEventType.FAILED) {
        updateData.deliveredAt = eventTime;
      }
    }
    if (eventType === CallbackEventType.FAILED) {
      if (!comm.failureReason) {
        updateData.failureReason = failureReason || 'Unknown carrier error';
      }
    }
    if (eventType === CallbackEventType.OPENED || incomingWeight > STATUS_ORDER.opened) {
      if (!comm.openedAt) updateData.openedAt = eventTime;
    }
    if (eventType === CallbackEventType.READ || incomingWeight > STATUS_ORDER.read) {
      if (!comm.readAt) updateData.readAt = eventTime;
    }
    if (eventType === CallbackEventType.CLICKED || incomingWeight > STATUS_ORDER.clicked) {
      if (!comm.clickedAt) updateData.clickedAt = eventTime;
    }
    if (eventType === CallbackEventType.PURCHASED) {
      if (!comm.purchasedAt) updateData.purchasedAt = eventTime;
    }

    // If there is any update required
    if (Object.keys(updateData).length > 0) {
      return this.prisma.communication.update({
        where: { id: communicationId },
        data: updateData,
      });
    }

    return comm;
  }

  async findByCampaign(campaignId: string, query?: { page?: string; limit?: string }) {
    const pagination = buildPagination(query);

    const where = { campaignId };

    const [data, total] = await Promise.all([
      this.prisma.communication.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.communication.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
  }

  async findAll(query?: { page?: string; limit?: string }) {
    const pagination = buildPagination(query);

    const [data, total] = await Promise.all([
      this.prisma.communication.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.communication.count(),
    ]);

    return paginatedResult(data, total, pagination);
  }
}
