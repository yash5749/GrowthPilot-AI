import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { SegmentsModule } from '../segments/segments.module';
import { ChannelClientModule } from '../channel-client/channel-client.module';

@Module({
  imports: [SegmentsModule, ChannelClientModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
