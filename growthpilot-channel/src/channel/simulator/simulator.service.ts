import { Injectable, Logger } from '@nestjs/common';
import { ChannelConfig } from '@/config/channel-config';
import { CallbackEventType } from '../dto/callback-event.dto';

export interface SimulatorOptions {
  communicationId: string;
  customerId: string;
  channel: string;
  isSuccess: boolean;
}

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);

  constructor(private readonly config: ChannelConfig) {}

  simulate(options: SimulatorOptions) {
    const { communicationId, customerId, channel, isSuccess } = options;

    if (isSuccess) {
      this.scheduleSuccessPath(communicationId, customerId, channel);
    } else {
      this.scheduleFailurePath(communicationId, customerId, channel);
    }
  }

  private scheduleSuccessPath(communicationId: string, customerId: string, channel: string) {
    this.scheduleEvent(communicationId, CallbackEventType.SENT, this.config.sentDelay);
    this.scheduleEvent(communicationId, CallbackEventType.DELIVERED, this.config.deliveredDelay);
    this.scheduleEvent(communicationId, CallbackEventType.OPENED, this.config.openedDelay);
    this.scheduleEvent(communicationId, CallbackEventType.READ, this.config.openedDelay + 500);
    this.scheduleEvent(communicationId, CallbackEventType.CLICKED, this.config.clickedDelay);
    this.scheduleEvent(communicationId, CallbackEventType.PURCHASED, this.config.purchasedDelay);
  }

  private scheduleFailurePath(communicationId: string, customerId: string, channel: string) {
    this.scheduleEvent(communicationId, CallbackEventType.SENT, this.config.sentDelay);
    this.scheduleEvent(
      communicationId,
      CallbackEventType.FAILED,
      this.config.failedDelay,
      'Carrier delivery failed: temporary unreachable number'
    );
  }

  private scheduleEvent(
    communicationId: string,
    eventType: CallbackEventType,
    delayMs: number,
    failureReason?: string
  ) {
    if (delayMs <= 0) return;

    setTimeout(async () => {
      await this.postCallback(communicationId, eventType, failureReason);
    }, delayMs);
  }

  private async postCallback(
    communicationId: string,
    eventType: CallbackEventType,
    failureReason?: string
  ) {
    const url = this.config.crmCallbackUrl;
    const payload: Record<string, unknown> = {
      communicationId,
      eventType,
      timestamp: new Date().toISOString(),
    };

    if (failureReason) {
      payload.failureReason = failureReason;
    }

    let attempt = 0;
    const maxAttempts = this.config.callbackRetryAttempts;
    const retryDelay = this.config.callbackRetryDelayMs;

    while (attempt < maxAttempts) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          this.logger.log(`Callback [${eventType}] sent for ${communicationId} (attempt ${attempt + 1})`);
          return;
        }

        const text = await response.text();
        this.logger.warn(
          `Callback [${eventType}] for ${communicationId} failed: ${response.status} - ${text} (attempt ${attempt + 1}/${maxAttempts})`
        );
      } catch (err) {
        this.logger.warn(
          `Callback [${eventType}] for ${communicationId} error: ${err.message} (attempt ${attempt + 1}/${maxAttempts})`
        );
      }

      attempt++;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    this.logger.error(`Callback [${eventType}] for ${communicationId} failed after ${maxAttempts} attempts`);
  }
}