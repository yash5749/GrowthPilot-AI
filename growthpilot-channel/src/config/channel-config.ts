import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChannelProbabilities {
  delivery: number;
  open: number;
  read: number;
  click: number;
  purchase: number;
}

@Injectable()
export class ChannelConfig {
  constructor(private readonly configService: ConfigService) { }

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
    return this.configService.get<number>('SIM_DELIVERED_DELAY') || 1000;
  }

  get failedDelay(): number {
    return this.configService.get<number>('SIM_FAILED_DELAY') || 1500;
  }

  get openedDelay(): number {
    return this.configService.get<number>('SIM_OPENED_DELAY') || 1500;
  }

  get readDelay(): number {
    return this.configService.get<number>('SIM_READ_DELAY') || 500;
  }

  get clickedDelay(): number {
    return this.configService.get<number>('SIM_CLICKED_DELAY') || 1000;
  }

  get purchasedDelay(): number {
    return this.configService.get<number>('SIM_PURCHASED_DELAY') || 1500;
  }

  get callbackRetryAttempts(): number {
    return this.configService.get<number>('CALLBACK_RETRY_ATTEMPTS') || 3;
  }

  get callbackRetryDelayMs(): number {
    return this.configService.get<number>('CALLBACK_RETRY_DELAY_MS') || 1000;
  }

  getChannelProbabilities(channel: string): ChannelProbabilities {
    const prefix = `CHANNEL_SIM_${channel.toUpperCase()}`;

    const getProb = (stage: string, defaultVal: number): number => {
      const val = this.configService.get<number>(`${prefix}_${stage}`);
      return val !== undefined ? val : defaultVal;
    };

    const legacyFailureRate = this.configService.get<number>('SIM_FAILURE_RATE');
    const defaultDelivery = legacyFailureRate !== undefined
      ? 1 - legacyFailureRate
      : this.getDefaultDelivery(channel);

    return {
      delivery: getProb('DELIVERY', defaultDelivery),
      open: getProb('OPEN', this.getDefaultOpen(channel)),
      read: getProb('READ', this.getDefaultRead(channel)),
      click: getProb('CLICK', this.getDefaultClick(channel)),
      purchase: getProb('PURCHASE', this.getDefaultPurchase(channel)),
    };
  }

  private getDefaultDelivery(channel: string): number {
    const map: Record<string, number> = { whatsapp: 0.94, email: 0.90, sms: 0.96 };
    return map[channel] ?? 0.90;
  }

  private getDefaultOpen(channel: string): number {
    const map: Record<string, number> = { whatsapp: 0.75, email: 0.48, sms: 0.52 };
    return map[channel] ?? 0.50;
  }

  private getDefaultRead(channel: string): number {
    const map: Record<string, number> = { whatsapp: 0.80, email: 0.60, sms: 0.70 };
    return map[channel] ?? 0.60;
  }

  private getDefaultClick(channel: string): number {
    const map: Record<string, number> = { whatsapp: 0.28, email: 0.14, sms: 0.18 };
    return map[channel] ?? 0.15;
  }

  private getDefaultPurchase(channel: string): number {
    const map: Record<string, number> = { whatsapp: 0.90, email: 0.10, sms: 0.5 };
    return map[channel] ?? 0.05;
  }
}
