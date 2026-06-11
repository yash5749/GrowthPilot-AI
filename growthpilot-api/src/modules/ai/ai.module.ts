import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { MockAiProvider } from './providers/mock-ai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GithubModelsProvider } from './providers/github-models.provider';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    {
      provide: AI_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const providerName = configService.get<string>('AI_PROVIDER') || 'mock';
        switch (providerName) {
          case 'gemini':
            return new GeminiProvider(configService);
          case 'github':
            return new GithubModelsProvider(configService);
          case 'mock':
          default:
            return new MockAiProvider();
        }
      },
      inject: [ConfigService],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
