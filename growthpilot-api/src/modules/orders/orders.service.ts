import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly customersRepository: CustomersRepository,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const customer = await this.customersRepository.findById(createOrderDto.customerId);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${createOrderDto.customerId} not found`);
    }
    return this.repository.create({
      customerId: createOrderDto.customerId,
      orderTotal: createOrderDto.orderTotal,
      currency: createOrderDto.currency || 'USD',
      channel: createOrderDto.channel,
      status: createOrderDto.status,
    });
  }

  async findAll(query?: { page?: string; limit?: string }) {
    const page = query?.page ? parseInt(query.page, 10) : 1;
    const limit = query?.limit ? parseInt(query.limit, 10) : 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.repository.findMany({
        skip,
        take: limit,
        orderBy: { orderedAt: 'desc' },
      }),
      this.repository.count(),
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
}
