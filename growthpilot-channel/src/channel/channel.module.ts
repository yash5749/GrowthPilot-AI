import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { SimulatorService } from './simulator/simulator.service';

@Module({
  imports: [AppConfigModule],
  controllers: [ChannelController],
  providers: [ChannelService, SimulatorService],
  exports: [ChannelService],
})
export class ChannelModule {}