import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  objective!: string;

  @IsUUID()
  @IsNotEmpty()
  segmentId!: string;

  @IsString()
  @IsNotEmpty()
  messageTemplate!: string;

  @IsString()
  @IsNotEmpty()
  channel!: string;
}
