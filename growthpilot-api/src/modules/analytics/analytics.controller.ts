import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics/dashboard')
  async getDashboard() {
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get('campaigns/:id/analytics')
  async getCampaignAnalytics(@Param('id') id: string) {
    return this.analyticsService.getCampaignAnalytics(id);
  }

  @Get('analytics/campaigns/:id')
  async getCampaignAnalyticsAlt(@Param('id') id: string) {
    return this.analyticsService.getCampaignAnalytics(id);
  }
}
