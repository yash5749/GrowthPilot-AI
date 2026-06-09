import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

    try {
      this.logger.log(`Sending communication ${payload.communicationId} to channel service at ${sendUrl}`);

      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(
          `Channel service responded with ${response.status}: ${text}`,
        );
        throw new Error(`Channel service error: ${response.status} - ${text}`);
      }

      const result = await response.json();
      this.logger.log(
        `Channel service accepted communication ${payload.communicationId}: ${JSON.stringify(result)}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Failed to send communication ${payload.communicationId} to channel service: ${err.message}`,
      );
      throw err;
    }
  }
}