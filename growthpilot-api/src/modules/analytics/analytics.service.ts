import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampaignAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
    }

    const communications = await this.prisma.communication.findMany({
      where: { campaignId },
      include: {
        customer: {
          include: {
            orders: {
              where: {
                status: 'completed',
              },
            },
          },
        },
      },
    });

    const audienceSize = communications.length;

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    let openedCount = 0;
    let clickedCount = 0;
    let purchasedCount = 0;
    let revenueAttributed = 0;

    const campaignSentTime = campaign.sentAt ? new Date(campaign.sentAt).getTime() : 0;

    for (const comm of communications) {
      const status = comm.status;

      if (['sent', 'delivered', 'opened', 'clicked', 'purchased'].includes(status)) {
        sentCount++;
      }
      if (['delivered', 'opened', 'clicked', 'purchased'].includes(status)) {
        deliveredCount++;
      }
      if (status === 'failed') {
        failedCount++;
      }
      if (['opened', 'clicked', 'purchased'].includes(status)) {
        openedCount++;
      }
      if (['clicked', 'purchased'].includes(status)) {
        clickedCount++;
      }
      if (status === 'purchased') {
        purchasedCount++;

        // Attribute completed orders that happened at or after outreach was sent
        const commSentTime = comm.sentAt ? new Date(comm.sentAt).getTime() : campaignSentTime;
        const matchingOrders = comm.customer.orders.filter((order) => {
          const orderTime = new Date(order.orderedAt).getTime();
          return orderTime >= commSentTime;
        });

        const commRevenue = matchingOrders.reduce((sum, order) => sum + order.orderTotal, 0);
        revenueAttributed += commRevenue;
      }
    }

    const deliveryRate = sentCount > 0 ? (deliveredCount / sentCount) : 0;
    const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) : 0;
    const clickRate = openedCount > 0 ? (clickedCount / openedCount) : 0;
    const conversionRate = sentCount > 0 ? (purchasedCount / sentCount) : 0;

    return {
      campaignId,
      campaignName: campaign.name,
      objective: campaign.objective,
      status: campaign.status,
      audienceSize,
      sentCount,
      deliveredCount,
      failedCount,
      openedCount,
      clickedCount,
      purchasedCount,
      revenueAttributed,
      rates: {
        deliveryRate,
        openRate,
        clickRate,
        conversionRate,
      },
    };
  }

  async getDashboardAnalytics() {
    const [
      totalCustomers,
      totalOrders,
      activeSegments,
      campaignsSent,
      allComms,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.order.count(),
      this.prisma.segment.count(),
      this.prisma.campaign.count({ where: { status: 'sent' } }),
      this.prisma.communication.findMany({
        include: {
          customer: {
            include: {
              orders: {
                where: {
                  status: 'completed',
                },
              },
            },
          },
        },
      }),
    ]);

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    let openedCount = 0;
    let clickedCount = 0;
    let purchasedCount = 0;
    let revenueAttributed = 0;

    for (const comm of allComms) {
      const status = comm.status;
      if (['sent', 'delivered', 'opened', 'clicked', 'purchased'].includes(status)) {
        sentCount++;
      }
      if (['delivered', 'opened', 'clicked', 'purchased'].includes(status)) {
        deliveredCount++;
      }
      if (status === 'failed') {
        failedCount++;
      }
      if (['opened', 'clicked', 'purchased'].includes(status)) {
        openedCount++;
      }
      if (['clicked', 'purchased'].includes(status)) {
        clickedCount++;
      }
      if (status === 'purchased') {
        purchasedCount++;

        const commSentTime = comm.sentAt ? new Date(comm.sentAt).getTime() : 0;
        const matchingOrders = comm.customer.orders.filter((order) => {
          const orderTime = new Date(order.orderedAt).getTime();
          return orderTime >= commSentTime;
        });
        const commRevenue = matchingOrders.reduce((sum, order) => sum + order.orderTotal, 0);
        revenueAttributed += commRevenue;
      }
    }

    const deliveryRate = sentCount > 0 ? (deliveredCount / sentCount) : 0;
    const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) : 0;
    const clickRate = openedCount > 0 ? (clickedCount / openedCount) : 0;
    const conversionRate = sentCount > 0 ? (purchasedCount / sentCount) : 0;

    return {
      totalCustomers,
      totalOrders,
      activeSegments,
      campaignsSent,
      aggregateCounters: {
        sentCount,
        deliveredCount,
        failedCount,
        openedCount,
        clickedCount,
        purchasedCount,
      },
      rates: {
        deliveryRate,
        openRate,
        clickRate,
        conversionRate,
      },
      revenueAttributed,
    };
  }
}
