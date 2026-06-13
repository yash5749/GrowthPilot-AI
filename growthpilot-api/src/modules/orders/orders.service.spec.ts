import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { buildOrderDto, buildMockCustomer } from '../../../test/helpers/factories';
import * as fs from 'fs';
import * as path from 'path';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: jest.Mocked<OrdersRepository>;
  let customersRepository: jest.Mocked<CustomersRepository>;

  const mockCustomer = buildMockCustomer();

  const mockOrdersRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  const mockCustomersRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: mockOrdersRepository },
        { provide: CustomersRepository, useValue: mockCustomersRepository },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get(OrdersRepository);
    customersRepository = module.get(CustomersRepository);
  });

  describe('create', () => {
    it('creates an order for an existing customer', async () => {
      mockCustomersRepository.findById.mockResolvedValue(mockCustomer);
      mockOrdersRepository.create.mockResolvedValue({ id: 'o1', ...buildOrderDto() });

      const dto = buildOrderDto();
      const result = await service.create(dto);

      expect(customersRepository.findById).toHaveBeenCalledWith(dto.customerId);
      expect(ordersRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws NotFoundException for non-existent customer', async () => {
      mockCustomersRepository.findById.mockResolvedValue(null);

      await expect(service.create(buildOrderDto())).rejects.toThrow(NotFoundException);
      expect(ordersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated orders', async () => {
      mockOrdersRepository.findMany.mockResolvedValue([
        { id: 'o1', orderTotal: 99.99, customer: { id: 'c1', name: 'Alice', email: 'alice@example.com' } },
      ]);
      mockOrdersRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '10' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('returns empty array when no orders exist', async () => {
      mockOrdersRepository.findMany.mockResolvedValue([]);
      mockOrdersRepository.count.mockResolvedValue(0);

      const result = await service.findAll({ page: '1', limit: '10' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('importCsv', () => {
    beforeEach(() => {
      mockCustomersRepository.findById.mockResolvedValue(null);
    });

    it('imports valid orders using customer email resolution', async () => {
      mockCustomersRepository.findByEmail.mockImplementation(async (email: string) => {
        const map: Record<string, any> = {
          'alice@example.com': { id: 'c1', name: 'Alice', email: 'alice@example.com' },
          'bob@example.com': { id: 'c2', name: 'Bob', email: 'bob@example.com' },
          'charlie@example.com': { id: 'c3', name: 'Charlie', email: 'charlie@example.com' },
        };
        return map[email] || null;
      });
      mockOrdersRepository.create.mockResolvedValue({ id: 'o1' });
      const buffer = fs.readFileSync(path.join(__dirname, '../../../test/fixtures/orders-valid.csv'));

      const result = await service.importCsv(buffer);

      expect(result.total).toBe(4);
      expect(result.inserted).toBe(4);
      expect(result.failed).toBe(0);
    });

    it('reports invalid rows (missing customer, missing fields, bad data)', async () => {
      mockCustomersRepository.findByEmail.mockImplementation(async (email: string) => {
        const map: Record<string, any> = {
          'alice@example.com': { id: 'c1', name: 'Alice', email: 'alice@example.com' },
          'bob@example.com': { id: 'c2', name: 'Bob', email: 'bob@example.com' },
        };
        return map[email] || null;
      });
      mockOrdersRepository.create.mockResolvedValue({ id: 'o1' });
      const buffer = fs.readFileSync(path.join(__dirname, '../../../test/fixtures/orders-invalid.csv'));

      const result = await service.importCsv(buffer);

      expect(result.total).toBe(5);
      expect(result.inserted).toBeLessThan(5);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.message.includes('Customer not found'))).toBe(true);
    });

    it('resolves customer by ID when customerId column is present', async () => {
      const csvBuffer = Buffer.from(
        'customerId,orderTotal,currency,orderedAt,channel,status\n' +
        'c-123,49.99,USD,2026-01-01,email,completed\n'
      );
      mockCustomersRepository.findById.mockResolvedValue({ id: 'c-123', name: 'Alice', email: 'alice@example.com' });
      mockOrdersRepository.create.mockResolvedValue({ id: 'o1' });

      const result = await service.importCsv(csvBuffer);

      expect(result.inserted).toBe(1);
      expect(customersRepository.findById).toHaveBeenCalledWith('c-123');
    });

    it('handles malformed CSV gracefully', async () => {
      const buffer = Buffer.from('not,valid\n"broken');

      const result = await service.importCsv(buffer);

      expect(result.failed).toBe(1);
      expect(result.errors[0].message).toContain('Failed to parse CSV');
    });

    it('handles empty CSV', async () => {
      const result = await service.importCsv(Buffer.from('customerEmail,orderTotal,channel,status\n'));

      expect(result.total).toBe(0);
      expect(result.inserted).toBe(0);
    });
  });
});
