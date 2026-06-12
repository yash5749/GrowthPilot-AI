import { Injectable, Logger } from '@nestjs/common';
import { ChannelConfig } from '@/config/channel-config';
import { CallbackEventType } from '../dto/callback-event.dto';

export interface SimulatorOptions {
  communicationId: string;
  customerId: string;
  channel: string;
}

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);

  constructor(private readonly config: ChannelConfig) {}

  async simulate(options: SimulatorOptions) {
    const { communicationId, channel } = options;
    const probs = this.config.getChannelProbabilities(channel);

    this.logger.log(
      `Simulating ${channel} comm ${communicationId}: ` +
      `delivery=${probs.delivery} open=${probs.open} read=${probs.read} click=${probs.click} purchase=${probs.purchase}`
    );

    const sent = await this.fire(communicationId, CallbackEventType.SENT, this.config.sentDelay);
    if (!sent) return;

    const delivered = await this.maybe(
      communicationId, CallbackEventType.DELIVERED, probs.delivery, this.config.deliveredDelay,
    );
    if (!delivered) {
      await this.fire(communicationId, CallbackEventType.FAILED, 0, 'Carrier delivery failed: temporary unreachable number');
      return;
    }

    const opened = await this.maybe(
      communicationId, CallbackEventType.OPENED, probs.open, this.config.openedDelay,
    );
    if (!opened) return;

    const read = await this.maybe(
      communicationId, CallbackEventType.READ, probs.read, this.config.readDelay,
    );
    if (!read) return;

    const clicked = await this.maybe(
      communicationId, CallbackEventType.CLICKED, probs.click, this.config.clickedDelay,
    );
    if (!clicked) return;

    await this.maybe(
      communicationId, CallbackEventType.PURCHASED, probs.purchase, this.config.purchasedDelay,
    );
  }

  private async maybe(
    communicationId: string,
    eventType: CallbackEventType,
    probability: number,
    delayMs: number,
  ): Promise<boolean> {
    if (delayMs > 0) {
      await this.sleep(delayMs);
    }

    if (Math.random() < probability) {
      this.logger.log(`Comm ${communicationId}: ${eventType} succeeds`);
      await this.postCallback(communicationId, eventType);
      return true;
    }

    this.logger.log(`Comm ${communicationId}: ${eventType} drops off (prob=${probability})`);
    return false;
  }

  private async fire(
    communicationId: string,
    eventType: CallbackEventType,
    delayMs: number,
    failureReason?: string,
  ): Promise<boolean> {
    if (delayMs > 0) {
      await this.sleep(delayMs);
    }

    await this.postCallback(communicationId, eventType, failureReason);
    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async postCallback(
    communicationId: string,
    eventType: CallbackEventType,
    failureReason?: string,
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
          `Callback [${eventType}] for ${communicationId} error: ${(err as Error).message} (attempt ${attempt + 1}/${maxAttempts})`
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
