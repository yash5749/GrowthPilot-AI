import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly repository: CustomersRepository) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const existing = await this.repository.findByEmail(createCustomerDto.email);
    if (existing) {
      throw new ConflictException(`Customer with email ${createCustomerDto.email} already exists`);
    }
    return this.repository.create(createCustomerDto);
  }

  async findAll(query?: { search?: string; page?: string; limit?: string }) {
    const page = query?.page ? parseInt(query.page, 10) : 1;
    const limit = query?.limit ? parseInt(query.limit, 10) : 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.repository.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.repository.count(where),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.repository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Calculate derived metrics on the fly
    const orderCount = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.orderTotal, 0);
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const lastOrderAt = orderCount > 0 ? customer.orders[0].orderedAt : null;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      orders: customer.orders,
      metrics: {
        totalSpent,
        orderCount,
        averageOrderValue,
        lastOrderAt,
      },
    };
  }
}
