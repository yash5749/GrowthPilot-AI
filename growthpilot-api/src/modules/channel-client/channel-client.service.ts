import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

@Injectable()
export class ChannelClientService {
  private readonly logger = new Logger(ChannelClientService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(payload: {
    communicationId: string;
    campaignId: string;
    customer: { id: string; name: string; phone: string | null; email: string };
    channel: string;
    message: string;
  }) {
    const channelServiceUrl = this.configService.get<string>('CHANNEL_SERVICE_URL');

    if (!channelServiceUrl) {
      this.logger.warn('CHANNEL_SERVICE_URL not configured, skipping external channel call');
      return;
    }

    const sendUrl = `${channelServiceUrl.replace(/\/$/, '')}/channel/send`;

    const body = {
      communicationId: payload.communicationId,
      campaignId: payload.campaignId,
      customer: {
        id: payload.customer.id,
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email,
      },
      channel: payload.channel,
      message: payload.message,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        this.logger.log(
          `Sending communication ${payload.communicationId} to channel service (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );

        const response = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Channel service error: ${response.status} - ${text}`);
        }

        const result = await response.json();
        this.logger.log(
          `Channel service accepted communication ${payload.communicationId}: ${JSON.stringify(result)}`,
        );
        return;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `Attempt ${attempt + 1}/${MAX_RETRIES} failed for communication ${payload.communicationId}: ${err.message}`,
        );

        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    this.logger.error(
      `Failed to send communication ${payload.communicationId} after ${MAX_RETRIES} attempts: ${lastError!.message}`,
    );
    throw lastError!;
  }
}