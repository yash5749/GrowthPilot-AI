import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { AI_PROVIDER, AiProvider } from './providers/ai-provider.interface';
import { AiSegmentDto, AiMessageDto, AiChannelRecommendationDto, AiInsightsDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly prisma: PrismaService,
  ) {}

  async suggestSegment(dto: AiSegmentDto) {
    // Enrich input with live customer summary from DB
    const [totalCustomers, orders] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.order.findMany({ where: { status: 'completed' } }),
    ]);

    const avgOrderValue =
      orders.length > 0
        ? orders.reduce((s, o) => s + o.orderTotal, 0) / orders.length
        : 0;

    const customers = await this.prisma.customer.findMany({
      select: { city: true },
    });

    const cityCounts = customers
      .filter((c) => c.city)
      .reduce<Record<string, number>>((acc, c) => {
        acc[c.city!] = (acc[c.city!] || 0) + 1;
        return acc;
      }, {});

    const topCities = Object.entries(cityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([city]) => city);

    const enrichedInput = {
      ...dto,
      customerSummary: dto.customerSummary ?? {
        totalCustomers,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        topCities,
      },
    };

    this.logger.log(`Generating AI segment suggestion for goal: "${dto.businessGoal}"`);
    return this.provider.generateSegment(enrichedInput);
  }

  async generateMessage(dto: AiMessageDto) {
    this.logger.log(`Generating AI message for segment "${dto.segmentName}" on ${dto.channel}`);
    return this.provider.generateMessage(dto);
  }

  async recommendChannel(dto: AiChannelRecommendationDto) {
    this.logger.log(`Recommending channel for segment "${dto.segmentName}"`);
    return this.provider.recommendChannel(dto);
  }

  async generateInsights(dto: AiInsightsDto) {
    // Load campaign analytics from DB
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${dto.campaignId} not found`);
    }

    const communications = await this.prisma.communication.findMany({
      where: { campaignId: dto.campaignId },
    });

    const audienceSize = communications.length;
    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    let openedCount = 0;
    let readCount = 0;
    let clickedCount = 0;
    let purchasedCount = 0;

    for (const comm of communications) {
      const s = comm.status;
      if (['sent', 'delivered', 'opened', 'read', 'clicked', 'purchased'].includes(s)) sentCount++;
      if (['delivered', 'opened', 'read', 'clicked', 'purchased'].includes(s)) deliveredCount++;
      if (s === 'failed') failedCount++;
      if (['opened', 'read', 'clicked', 'purchased'].includes(s)) openedCount++;
      if (['read', 'clicked', 'purchased'].includes(s)) readCount++;
      if (['clicked', 'purchased'].includes(s)) clickedCount++;
      if (s === 'purchased') purchasedCount++;
    }

    // Calculate attributed revenue for purchased communications
    let revenueAttributed = 0;
    if (purchasedCount > 0) {
      const purchasedComms = communications.filter((c) => c.status === 'purchased' && c.purchasedAt);
      for (const comm of purchasedComms) {
        const sentTime = comm.sentAt ? new Date(comm.sentAt).getTime() : (campaign.sentAt ? new Date(campaign.sentAt).getTime() : 0);
        const orders = await this.prisma.order.findMany({
          where: {
            customerId: comm.customerId,
            status: 'completed',
            orderedAt: { gte: new Date(sentTime) },
          },
        });
        revenueAttributed += orders.reduce((s, o) => s + o.orderTotal, 0);
      }
    }

    const deliveryRate = sentCount > 0 ? deliveredCount / sentCount : 0;
    const openRate = deliveredCount > 0 ? openedCount / deliveredCount : 0;
    const readRate = openedCount > 0 ? readCount / openedCount : 0;
    const clickRate = openedCount > 0 ? clickedCount / openedCount : 0;
    const conversionRate = sentCount > 0 ? purchasedCount / sentCount : 0;

    this.logger.log(`Generating AI insights for campaign "${campaign.name}"`);

    return this.provider.generateInsights({
      campaignName: campaign.name,
      objective: campaign.objective,
      audienceSize,
      sentCount,
      deliveredCount,
      openedCount,
      readCount,
      clickedCount,
      purchasedCount,
      revenueAttributed,
      rates: { deliveryRate, openRate, readRate, clickRate, conversionRate },
    });
  }
}
