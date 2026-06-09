import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { evaluateCustomer } from './segments.utils';

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSegmentDto: CreateSegmentDto) {
    return this.prisma.segment.create({
      data: {
        name: createSegmentDto.name,
        description: createSegmentDto.description,
        ruleJson: createSegmentDto.ruleJson as any,
        aiGenerated: createSegmentDto.aiGenerated ?? false,
      },
    });
  }

  async findAll() {
    return this.prisma.segment.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const segment = await this.prisma.segment.findUnique({
      where: { id },
    });
    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }
    return segment;
  }

  async preview(id: string) {
    const segment = await this.findOne(id);
    const rule = segment.ruleJson as any;

    const allCustomers = await this.prisma.customer.findMany({
      include: {
        orders: true,
      },
    });

    const matchingCustomers = allCustomers.filter((customer) =>
      evaluateCustomer(customer, rule),
    );

    const simplifiedCustomers = matchingCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      createdAt: customer.createdAt,
    }));

    return {
      segment,
      count: simplifiedCustomers.length,
      customers: simplifiedCustomers,
    };
  }

  async aiSuggest(businessGoal: string) {
    let name = 'Reactivation Campaign';
    let ruleJson: Record<string, any> = {
      lastOrderDays_gte: 60,
      totalSpent_gte: 100,
    };
    let reason = 'Targeting customers who spent over $100 but have not ordered in the last 60 days to trigger a reactivation flow.';

    const goalLower = businessGoal?.toLowerCase() || '';
    if (goalLower.includes('vip') || goalLower.includes('high value') || goalLower.includes('loyal')) {
      name = 'High Value Shoppers';
      ruleJson = {
        totalSpent_gte: 500,
        orderCount_gte: 3,
      };
      reason = 'Targeting loyal VIP customers who spent more than $500 across at least 3 orders.';
    } else if (goalLower.includes('new') || goalLower.includes('recent')) {
      name = 'Recent Shoppers';
      ruleJson = {
        lastOrderDays_lte: 30,
        orderCount_gte: 1,
      };
      reason = 'Targeting active shoppers who placed their first or subsequent orders in the last 30 days.';
    } else if (goalLower.includes('city') || goalLower.includes('local')) {
      name = 'Local New York Customers';
      ruleJson = {
        city: 'New York',
        orderCount_gte: 1,
      };
      reason = 'Targeting customers based in New York City with past orders for targeted regional campaigns.';
    }

    return {
      name,
      ruleJson,
      reason,
      aiGenerated: true,
    };
  }
}
