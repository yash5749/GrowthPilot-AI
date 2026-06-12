import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { parse } from 'csv-parse/sync';

interface ImportRow {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
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

    const [raw, total] = await Promise.all([
      this.repository.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.repository.count(where),
    ]);

    const data = raw.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      orderCount: c._count.orders,
      totalSpent: c.orders.reduce((sum, o) => sum + o.orderTotal, 0),
    }));

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

      if (!row.name || !row.name.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, message: 'Missing required field: name' });
        continue;
      }

      if (!row.email || !row.email.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, message: 'Missing required field: email' });
        continue;
      }

      const email = row.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        result.failed++;
        result.errors.push({ row: rowNum, message: `Invalid email format: ${row.email}` });
        continue;
      }

      const existing = await this.repository.findByEmail(email);
      if (existing) {
        result.skipped++;
        continue;
      }

      try {
        await this.repository.create({
          name: row.name.trim(),
          email,
          phone: row.phone?.trim() || undefined,
          city: row.city?.trim() || undefined,
        });
        result.inserted++;
      } catch (err: any) {
        result.failed++;
        result.errors.push({ row: rowNum, message: err?.message || 'Database error' });
      }
    }

    return result;
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
