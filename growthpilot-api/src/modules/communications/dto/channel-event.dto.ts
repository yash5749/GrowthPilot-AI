import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum CallbackEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  OPENED = 'opened',
  READ = 'read',
  CLICKED = 'clicked',
  PURCHASED = 'purchased',
}

export class ChannelEventDto {
  @IsUUID()
  @IsNotEmpty()
  communicationId!: string;

  @IsEnum(CallbackEventType)
  @IsNotEmpty()
  eventType!: CallbackEventType;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsString()
  @IsOptional()
  failureReason?: string;
}
