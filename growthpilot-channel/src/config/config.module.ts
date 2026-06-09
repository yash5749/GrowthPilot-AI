import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ChannelConfig } from './channel-config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [() => ({
        PORT: parseInt(process.env.PORT || '4001', 10),
        NODE_ENV: process.env.NODE_ENV || 'development',
        CRM_CALLBACK_URL: process.env.CRM_CALLBACK_URL || 'http://localhost:4000/api/callbacks/channel-event',
        SIM_SENT_DELAY: parseInt(process.env.SIM_SENT_DELAY || '500', 10),
        SIM_DELIVERED_DELAY: parseInt(process.env.SIM_DELIVERED_DELAY || '1500', 10),
        SIM_FAILED_DELAY: parseInt(process.env.SIM_FAILED_DELAY || '1500', 10),
        SIM_OPENED_DELAY: parseInt(process.env.SIM_OPENED_DELAY || '3000', 10),
        SIM_CLICKED_DELAY: parseInt(process.env.SIM_CLICKED_DELAY || '4500', 10),
        SIM_PURCHASED_DELAY: parseInt(process.env.SIM_PURCHASED_DELAY || '6000', 10),
        SIM_FAILURE_RATE: parseFloat(process.env.SIM_FAILURE_RATE || '0.10'),
        CALLBACK_RETRY_ATTEMPTS: parseInt(process.env.CALLBACK_RETRY_ATTEMPTS || '3', 10),
        CALLBACK_RETRY_DELAY_MS: parseInt(process.env.CALLBACK_RETRY_DELAY_MS || '1000', 10),
      })],
      validate: (config: Record<string, unknown>) => {
        if (!config.CRM_CALLBACK_URL) {
          throw new Error('CRM_CALLBACK_URL is required');
        }
        return config;
      },
    }),
  ],
  providers: [ChannelConfig],
  exports: [ChannelConfig],
})
export class AppConfigModule {}