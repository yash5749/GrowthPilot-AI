import { Injectable, Logger } from '@nestjs/common';
import { ChannelConfig } from '@/config/channel-config';
import { SimulatorService } from './simulator/simulator.service';
import { SendCommunicationDto, ChannelType } from './dto/send.dto';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    private readonly config: ChannelConfig,
    private readonly simulator: SimulatorService,
  ) {}

  async send(dto: SendCommunicationDto) {
    this.logger.log(`Received send request for comm ${dto.communicationId} via ${dto.channel}`);

    const isSuccess = Math.random() > this.config.failureRate;

    this.simulator.simulate({
      communicationId: dto.communicationId,
      customerId: dto.customer.id,
      channel: dto.channel,
      isSuccess,
    });

    return {
      accepted: true,
      communicationId: dto.communicationId,
      simulatedPath: isSuccess ? 'success' : 'failure',
    };
  }
}