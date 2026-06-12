import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  async create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(createCampaignDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.campaignsService.findAll({ page, limit, search });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    return this.campaignsService.approve(id);
  }

  @Post(':id/send')
  async send(@Param('id') id: string) {
    return this.campaignsService.send(id);
  }
}
