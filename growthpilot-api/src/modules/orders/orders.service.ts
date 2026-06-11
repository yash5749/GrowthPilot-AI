import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { parse } from 'csv-parse/sync';

interface ImportRow {
  customerId?: string;
  customerEmail?: string;
  orderTotal?: string;
  currency?: string;
  orderedAt?: string;
  channel?: string;
  status?: string;
}

interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  total: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: ImportError[];
}

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

  async importCsv(buffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = { total: 0, inserted: 0, skipped: 0, failed: 0, errors: [] };

    let records: ImportRow[];
    try {
      records = parse(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch {
      result.failed = 1;
      result.errors.push({ row: 0, message: 'Failed to parse CSV file. Check the file format.' });
      return result;
    }

    if (!Array.isArray(records) || records.length === 0) {
      return result;
    }

    result.total = records.length;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      const customerId = row.customerId?.trim();
      const customerEmail = row.customerEmail?.trim().toLowerCase();

      let resolvedCustomerId: string | null = null;

      if (customerId) {
        const customer = await this.customersRepository.findById(customerId);
        if (customer) {
          resolvedCustomerId = customer.id;
        }
      }

      if (!resolvedCustomerId && customerEmail) {
        const customer = await this.customersRepository.findByEmail(customerEmail);
        if (customer) {
          resolvedCustomerId = customer.id;
        }
      }

      if (!resolvedCustomerId) {
        const identifier = customerId || customerEmail || 'unknown';
        result.failed++;
        result.errors.push({ row: rowNum, message: `Customer not found: ${identifier}` });
        continue;
      }

      if (!row.orderTotal) {
        result.failed++;
        result.errors.push({ row: rowNum, message: 'Missing required field: orderTotal' });
        continue;
      }

      const orderTotal = parseFloat(row.orderTotal);
      if (isNaN(orderTotal) || orderTotal < 0) {
        result.failed++;
        result.errors.push({ row: rowNum, message: `Invalid orderTotal: ${row.orderTotal}` });
        continue;
      }

      if (!row.channel?.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, message: 'Missing required field: channel' });
        continue;
      }

      if (!row.status?.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, message: 'Missing required field: status' });
        continue;
      }

      let orderedAt: Date | undefined;
      if (row.orderedAt?.trim()) {
        orderedAt = new Date(row.orderedAt.trim());
        if (isNaN(orderedAt.getTime())) {
          result.failed++;
          result.errors.push({ row: rowNum, message: `Invalid date: ${row.orderedAt}` });
          continue;
        }
      }

      try {
        await this.repository.create({
          customerId: resolvedCustomerId,
          orderTotal,
          currency: row.currency?.trim() || 'USD',
          orderedAt: orderedAt || new Date(),
          channel: row.channel.trim(),
          status: row.status.trim(),
        });
        result.inserted++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({ row: rowNum, message: err?.message || 'Database error' });
      }
    }

    return result;
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
