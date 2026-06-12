import { Injectable, Logger } from '@nestjs/common';
import { SimulatorService } from './simulator/simulator.service';
import { SendCommunicationDto } from './dto/send.dto';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(private readonly simulator: SimulatorService) {}

  async send(dto: SendCommunicationDto) {
    this.logger.log(`Received send request for comm ${dto.communicationId} via ${dto.channel}`);

    this.simulator.simulate({
      communicationId: dto.communicationId,
      customerId: dto.customer.id,
      channel: dto.channel,
    });

    return {
      accepted: true,
      communicationId: dto.communicationId,
    };
  }
}
