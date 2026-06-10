import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiSegmentDto, AiMessageDto, AiChannelRecommendationDto, AiInsightsDto } from './dto/ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('segment')
  async suggestSegment(@Body() dto: AiSegmentDto) {
    return this.aiService.suggestSegment(dto);
  }

  @Post('message')
  async generateMessage(@Body() dto: AiMessageDto) {
    return this.aiService.generateMessage(dto);
  }

  @Post('recommend-channel')
  async recommendChannel(@Body() dto: AiChannelRecommendationDto) {
    return this.aiService.recommendChannel(dto);
  }

  @Post('insights')
  async generateInsights(@Body() dto: AiInsightsDto) {
    return this.aiService.generateInsights(dto);
  }
}
