import { Module } from '@nestjs/common';
import { ChannelClientService } from './channel-client.service';

@Module({
  providers: [ChannelClientService],
  exports: [ChannelClientService],
})
export class ChannelClientModule {}
