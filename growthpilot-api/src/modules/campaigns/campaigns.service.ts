import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { SegmentsService } from '../segments/segments.service';
import { ChannelClientService } from '../channel-client/channel-client.service';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segmentsService: SegmentsService,
    private readonly channelClientService: ChannelClientService,
  ) {}

  async create(createCampaignDto: CreateCampaignDto) {
    // Verify segment exists
    await this.segmentsService.findOne(createCampaignDto.segmentId);

    return this.prisma.campaign.create({
      data: {
        name: createCampaignDto.name,
        objective: createCampaignDto.objective,
        segmentId: createCampaignDto.segmentId,
        messageTemplate: createCampaignDto.messageTemplate,
        channel: createCampaignDto.channel,
        status: 'draft',
      },
    });
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      include: {
        segment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        segment: true,
      },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async approve(id: string) {
    const campaign = await this.findOne(id);
    if (campaign.status !== 'draft') {
      throw new BadRequestException(`Campaign status is already ${campaign.status}, cannot approve`);
    }
    return this.prisma.campaign.update({
      where: { id },
      data: { status: 'approved' },
    });
  }

  async send(id: string) {
    const campaign = await this.findOne(id);
    if (campaign.status !== 'approved') {
      throw new BadRequestException(
        `Campaign status is ${campaign.status}. Campaigns must be approved before sending.`,
      );
    }

    // Evaluate segment matching customers
    const previewResult = await this.segmentsService.preview(campaign.segmentId);
    const targetCustomers = previewResult.customers;

    if (targetCustomers.length === 0) {
      throw new BadRequestException('Target segment has 0 matching customers. Cannot send campaign.');
    }

    // Set campaign to sent
    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    // Create communications in database and trigger async outreach
    for (const customer of targetCustomers) {
      const messageRendered = campaign.messageTemplate
        .replace(/\{\{name\}\}/g, customer.name)
        .replace(/\{\{email\}\}/g, customer.email);

      // Create communication record
      const communication = await this.prisma.communication.upsert({
        where: {
          campaignId_customerId: {
            campaignId: id,
            customerId: customer.id,
          },
        },
        create: {
          campaignId: id,
          customerId: customer.id,
          channel: campaign.channel,
          messageRendered,
          status: 'pending',
        },
        update: {
          status: 'pending',
          messageRendered,
          failureReason: null,
          sentAt: null,
          deliveredAt: null,
          openedAt: null,
          clickedAt: null,
          purchasedAt: null,
        },
      });

      // Call channel client (external service)
      await this.channelClientService.send({
        communicationId: communication.id,
        campaignId: id,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },
        channel: campaign.channel,
        message: messageRendered,
      });
    }

    return {
      campaign: updatedCampaign,
      audienceSize: targetCustomers.length,
    };
  }
}
