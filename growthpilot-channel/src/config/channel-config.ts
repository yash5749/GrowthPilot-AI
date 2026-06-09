import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChannelConfig {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('PORT') || 4001;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  get crmCallbackUrl(): string {
    return this.configService.get<string>('CRM_CALLBACK_URL') || 'http://localhost:4000/api/callbacks/channel-event';
  }

  get sentDelay(): number {
    return this.configService.get<number>('SIM_SENT_DELAY') || 500;
  }

  get deliveredDelay(): number {
    return this.configService.get<number>('SIM_DELIVERED_DELAY') || 1500;
  }

  get failedDelay(): number {
    return this.configService.get<number>('SIM_FAILED_DELAY') || 1500;
  }

  get openedDelay(): number {
    return this.configService.get<number>('SIM_OPENED_DELAY') || 3000;
  }

  get clickedDelay(): number {
    return this.configService.get<number>('SIM_CLICKED_DELAY') || 4500;
  }

  get purchasedDelay(): number {
    return this.configService.get<number>('SIM_PURCHASED_DELAY') || 6000;
  }

  get failureRate(): number {
    return this.configService.get<number>('SIM_FAILURE_RATE') || 0.10;
  }

  get callbackRetryAttempts(): number {
    return this.configService.get<number>('CALLBACK_RETRY_ATTEMPTS') || 3;
  }

  get callbackRetryDelayMs(): number {
    return this.configService.get<number>('CALLBACK_RETRY_DELAY_MS') || 1000;
  }
}