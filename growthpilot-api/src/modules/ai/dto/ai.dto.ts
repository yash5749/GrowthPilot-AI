import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class AiSegmentDto {
  @IsString()
  @IsNotEmpty()
  businessGoal!: string;

  @IsObject()
  @IsOptional()
  customerSummary?: {
    totalCustomers: number;
    avgOrderValue?: number;
    topCities?: string[];
  };
}

export class AiMessageDto {
  @IsString()
  @IsNotEmpty()
  segmentName!: string;

  @IsString()
  @IsOptional()
  segmentDescription?: string;

  @IsString()
  @IsNotEmpty()
  channel!: string;

  @IsString()
  @IsNotEmpty()
  objective!: string;

  @IsString()
  @IsOptional()
  offer?: string;

  @IsString()
  @IsOptional()
  tone?: string;
}

export class AiChannelRecommendationDto {
  @IsString()
  @IsNotEmpty()
  segmentName!: string;

  @IsString()
  @IsNotEmpty()
  objective!: string;

  @IsOptional()
  audienceSize?: number;

  @IsObject()
  @IsOptional()
  historicalRates?: Record<string, { deliveryRate: number; openRate: number }>;
}

export class AiInsightsDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string;
}
