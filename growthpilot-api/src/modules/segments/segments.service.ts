import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { evaluateCustomer } from './segments.utils';
import { buildPagination, paginatedResult } from '../../common/helpers/pagination.helper';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SegmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

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

  async findAll(query?: { page?: string; limit?: string; search?: string }) {
    const pagination = buildPagination(query);

    const where: any = {};
    if (query?.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.segment.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.segment.count({ where }),
    ]);

    return paginatedResult(data, total, pagination);
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
    return this.aiService.suggestSegment({ businessGoal });
  }
}
