import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum CallbackEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  OPENED = 'opened',
  READ = 'read',
  CLICKED = 'clicked',
  PURCHASED = 'purchased',
}

export class CallbackEventDto {
  @IsUUID()
  @IsNotEmpty()
  communicationId!: string;

  @IsEnum(CallbackEventType)
  @IsNotEmpty()
  eventType!: CallbackEventType;

  @IsString()
  @IsNotEmpty()
  timestamp!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}