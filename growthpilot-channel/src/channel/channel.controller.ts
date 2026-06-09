import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { SendCommunicationDto } from './dto/send.dto';

@Controller()
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'growthpilot-channel',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async send(@Body() dto: SendCommunicationDto) {
    return this.channelService.send(dto);
  }
}