import { Module } from '@nestjs/common';
import { AiModule } from './modules/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { DbModule } from './db/db.module';
import { HealthModule } from './modules/health/health.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ChannelClientModule } from './modules/channel-client/channel-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    AiModule,
    DbModule,
    HealthModule,
    CustomersModule,
    OrdersModule,
    SegmentsModule,
    CampaignsModule,
    CommunicationsModule,
    AnalyticsModule,
    ChannelClientModule,
  ],
})
export class AppModule { }
