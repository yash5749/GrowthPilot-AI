import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../db/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPrisma = {
    $queryRawUnsafe: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService);
  });

  describe('GET /health', () => {
    it('returns ok status with uptime and timestamp', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /health/system', () => {
    it('returns healthy when all services respond', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ '1': 1 }]);
      mockConfigService.get.mockReturnValue('http://localhost:4001');

      const result = await controller.getSystemHealth();

      expect(result.status).toBe('healthy');
      expect(result.services.database.status).toBe('up');
    });

    it('returns degraded when channel service is not configured', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ '1': 1 }]);
      // Return null to simulate CHANNEL_SERVICE_URL not being set
      mockConfigService.get.mockReturnValue(null);

      const result = await controller.getSystemHealth();

      expect(result.status).toBe('degraded');
      expect(result.services.channelService.status).toBe('down');
    });

    it('returns unhealthy when database is down', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('Connection refused'));
      mockConfigService.get.mockReturnValue('http://localhost:4001');

      const result = await controller.getSystemHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('down');
    });
  });
});
