import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';
import { buildCustomerDto, buildMockCustomer } from '../../../test/helpers/factories';
import * as fs from 'fs';
import * as path from 'path';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: jest.Mocked<CustomersRepository>;

  const mockCustomer = buildMockCustomer();

  const mockRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: CustomersRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get(CustomersRepository);
  });

  describe('create', () => {
    it('creates a customer when email is unique', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCustomer);
      const dto = buildCustomerDto();

      const result = await service.create(dto);

      expect(repository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCustomer);
    });

    it('throws ConflictException when email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockCustomer);

      await expect(service.create(buildCustomerDto())).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated customers with metrics', async () => {
      mockRepository.findMany.mockResolvedValue([mockCustomer]);
      mockRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '20' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: mockCustomer.id,
        name: mockCustomer.name,
        email: mockCustomer.email,
        orderCount: 2,
        totalSpent: 149.99 + 59.99,
      });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('applies search filter when provided', async () => {
      mockRepository.findMany.mockResolvedValue([mockCustomer]);
      mockRepository.count.mockResolvedValue(1);

      await service.findAll({ search: 'Alice', page: '1', limit: '10' });

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'Alice', mode: 'insensitive' } },
              { email: { contains: 'Alice', mode: 'insensitive' } },
              { city: { contains: 'Alice', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('returns empty data set when no customers match', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await service.findAll({ page: '1', limit: '10' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('returns customer with computed metrics', async () => {
      mockRepository.findById.mockResolvedValue(mockCustomer);

      const result = await service.findOne(mockCustomer.id);

      expect(result.metrics).toEqual({
        totalSpent: 149.99 + 59.99,
        orderCount: 2,
        averageOrderValue: (149.99 + 59.99) / 2,
        lastOrderAt: mockCustomer.orders[0].orderedAt,
      });
    });

    it('throws when customer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('Customer with ID nonexistent not found');
    });
  });

  describe('importCsv', () => {
    it('imports valid customers from CSV', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCustomer);
      const buffer = fs.readFileSync(path.join(__dirname, '../../../test/fixtures/customers-valid.csv'));

      const result = await service.importCsv(buffer);

      expect(result.total).toBe(5);
      expect(result.inserted).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('reports invalid rows without crashing', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCustomer);
      const buffer = fs.readFileSync(path.join(__dirname, '../../../test/fixtures/customers-invalid.csv'));

      const result = await service.importCsv(buffer);

      expect(result.total).toBe(4);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.message.includes('Missing required field'))).toBe(true);
      expect(result.errors.some((e) => e.message.includes('Invalid email format'))).toBe(true);
    });

    it('skips duplicate emails', async () => {
      mockRepository.findByEmail
        .mockResolvedValueOnce(null)   // alice – insert
        .mockResolvedValueOnce(null)   // bob – insert
        .mockResolvedValueOnce(mockCustomer) // alice again – skip duplicate
        .mockResolvedValueOnce(null)   // frank – insert
        .mockResolvedValueOnce(mockCustomer); // bob again – skip duplicate
      mockRepository.create.mockResolvedValue(mockCustomer);
      const buffer = fs.readFileSync(path.join(__dirname, '../../../test/fixtures/customers-duplicates.csv'));

      const result = await service.importCsv(buffer);

      expect(result.total).toBe(5);
      expect(result.inserted).toBe(3);
      expect(result.skipped).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('handles completely empty CSV gracefully', async () => {
      const buffer = Buffer.from('name,email,phone,city\n');

      const result = await service.importCsv(buffer);

      expect(result.total).toBe(0);
      expect(result.inserted).toBe(0);
    });

    it('handles malformed CSV gracefully', async () => {
      const buffer = Buffer.from('not,valid,csv\n"unclosed,quote');

      const result = await service.importCsv(buffer);

      expect(result.failed).toBe(1);
      expect(result.errors[0].message).toContain('Failed to parse CSV');
    });
  });
});
