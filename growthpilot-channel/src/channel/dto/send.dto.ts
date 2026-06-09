import { IsString, IsNotEmpty, IsUUID, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ChannelType {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  RCS = 'rcs',
}

export class CustomerDto {
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class SendCommunicationDto {
  @IsUUID()
  @IsNotEmpty()
  communicationId!: string;

  @IsUUID()
  @IsNotEmpty()
  campaignId!: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @IsEnum(ChannelType)
  @IsNotEmpty()
  channel!: ChannelType;

  @IsString()
  @IsNotEmpty()
  message!: string;
}