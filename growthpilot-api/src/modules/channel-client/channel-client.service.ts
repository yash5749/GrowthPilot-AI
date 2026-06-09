import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChannelClientService {
  private readonly logger = new Logger(ChannelClientService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(payload: {
    communicationId: string;
    customer: { id: string; name: string; phone: string | null; email: string };
    channel: string;
    message: string;
  }) {
    const port = this.configService.get<number>('PORT') || 4000;
    const callbackUrl = `http://localhost:${port}/api/callbacks/channel-event`;

    // Determine path: 90% success, 10% failure
    const isSuccess = Math.random() > 0.10;

    this.logger.log(`Starting simulated outreach for comm ID ${payload.communicationId} via ${payload.channel}. Expected path: ${isSuccess ? 'Success' : 'Failure'}`);

    if (isSuccess) {
      this.scheduleCallback(payload.communicationId, 'sent', 500, callbackUrl);
      this.scheduleCallback(payload.communicationId, 'delivered', 1500, callbackUrl);
      this.scheduleCallback(payload.communicationId, 'opened', 3000, callbackUrl);
      this.scheduleCallback(payload.communicationId, 'clicked', 4500, callbackUrl);
      this.scheduleCallback(payload.communicationId, 'purchased', 6000, callbackUrl);
    } else {
      this.scheduleCallback(payload.communicationId, 'sent', 500, callbackUrl);
      this.scheduleCallback(
        payload.communicationId,
        'failed',
        1500,
        callbackUrl,
        'Carrier delivery failed: temporary unreachable number',
      );
    }
  }

  private scheduleCallback(
    communicationId: string,
    eventType: string,
    delayMs: number,
    callbackUrl: string,
    failureReason?: string,
  ) {
    setTimeout(async () => {
      try {
        const body = {
          communicationId,
          eventType,
          timestamp: new Date().toISOString(),
          failureReason,
        };

        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const text = await response.text();
          this.logger.error(
            `Failed to deliver simulated webhook for ${eventType} on ${communicationId}. Status: ${response.status}. Body: ${text}`,
          );
        } else {
          this.logger.log(
            `Successfully triggered simulated callback event [${eventType}] for comm ID ${communicationId}`,
          );
        }
      } catch (err: any) {
        this.logger.error(
          `Error triggering callback webhook for ${eventType} on ${communicationId}: ${err.message}`,
        );
      }
    }, delayMs);
  }
}
