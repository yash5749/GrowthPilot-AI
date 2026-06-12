import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';

@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  async create(@Body() createSegmentDto: CreateSegmentDto) {
    return this.segmentsService.create(createSegmentDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.segmentsService.findAll({ page, limit, search });
  }

  @Post('ai-suggest')
  async aiSuggest(@Body() body: { businessGoal: string }) {
    return this.segmentsService.aiSuggest(body.businessGoal);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.segmentsService.findOne(id);
  }

  @Post(':id/preview')
  async preview(@Param('id') id: string) {
    return this.segmentsService.preview(id);
  }
}
