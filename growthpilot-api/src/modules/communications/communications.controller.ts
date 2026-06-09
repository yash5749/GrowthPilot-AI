import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { ChannelEventDto } from './dto/channel-event.dto';

@Controller()
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('callbacks/channel-event')
  async handleCallback(@Body() dto: ChannelEventDto) {
    return this.communicationsService.handleCallback(dto);
  }

  @Get('communications')
  async findAll() {
    return this.communicationsService.findAll();
  }

  @Get('campaigns/:id/communications')
  async findByCampaign(@Param('id') id: string) {
    return this.communicationsService.findByCampaign(id);
  }
}
