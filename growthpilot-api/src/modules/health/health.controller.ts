import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../db/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('system')
  async getSystemHealth() {
    const timestamp = new Date().toISOString();
    const services: {
      api: { status: 'up' | 'down' };
      database: { status: 'up' | 'down' };
      channelService: { status: 'up' | 'down' };
    } = {
      api: { status: 'up' },
      database: { status: 'up' },
      channelService: { status: 'up' },
    };

    // Check database connectivity
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      services.database.status = 'up';
    } catch (err: unknown) {
      services.database.status = 'down';
      this.logger.error(`Database health check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Check channel service connectivity
    const channelServiceUrl = this.configService.get<string>('CHANNEL_SERVICE_URL');
    if (channelServiceUrl) {
      try {
        const healthUrl = `${channelServiceUrl.replace(/\/$/, '')}/channel/health`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          services.channelService.status = 'down';
          this.logger.warn(`Channel service health check returned ${response.status}`);
        }
      } catch (err: unknown) {
        services.channelService.status = 'down';
        this.logger.warn(`Channel service health check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      services.channelService.status = 'down';
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (services.database.status === 'down') {
      overallStatus = 'unhealthy';
    } else if (services.channelService.status === 'down') {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      timestamp,
      services,
    };
  }
}
