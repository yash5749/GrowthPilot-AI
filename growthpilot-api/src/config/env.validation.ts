import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsBoolean, IsOptional, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

enum AiProvider {
  Mock = 'mock',
  Github = 'github',
  Gemini = 'gemini',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  CHANNEL_SERVICE_URL?: string;

  @IsEnum(AiProvider)
  @IsOptional()
  AI_PROVIDER?: string;

  @IsString()
  @IsOptional()
  AI_MODEL?: string;

  @IsString()
  @IsOptional()
  GEMINI_MODEL?: string;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  GITHUB_MODELS_API_KEY?: string;

  @IsString()
  @IsOptional()
  GITHUB_MODELS_ENDPOINT?: string;

  @IsBoolean()
  @IsOptional()
  GITHUB_MODELS_JSON_MODE?: boolean;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}
