import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProvider,
  SegmentPrompt,
  SegmentSuggestion,
  MessagePrompt,
  MessageSuggestion,
  ChannelRecommendationPrompt,
  ChannelRecommendation,
  InsightPrompt,
  InsightSummary,
} from './ai-provider.interface';
import { MockAiProvider } from './mock-ai.provider';

@Injectable()
export class GithubModelsProvider implements AiProvider {
  private readonly logger = new Logger(GithubModelsProvider.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly endpoint: string;
  private readonly useJsonMode: boolean;
  private readonly fallback: MockAiProvider;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GITHUB_MODELS_API_KEY');
    this.model = this.configService.get<string>('AI_MODEL') || 'gpt-4o-mini';
    this.endpoint = this.configService.get<string>('GITHUB_MODELS_ENDPOINT') || 'https://models.inference.ai.azure.com/chat/completions';
    this.useJsonMode = this.configService.get<boolean>('GITHUB_MODELS_JSON_MODE') ?? true;
    this.fallback = new MockAiProvider();
    if (!this.apiKey) {
      this.logger.warn('GITHUB_MODELS_API_KEY not set — GitHub Models calls will fail.');
    }
  }

  private async callGithubModels(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No GitHub Models API key configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 512,
    };

    if (this.useJsonMode) {
      body.response_format = { type: 'json_object' };
    }

    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      throw new Error(`GitHub Models HTTP request failed: ${err.message}`);
    }

    clearTimeout(timeout);

    if (!res.ok) {
      const responseBody = await res.text();
      throw new Error(`GitHub Models API error: status=${res.status}, body=${responseBody.slice(0, 500)}`);
    }

    const data = (await res.json()) as any;
    return (data?.choices?.[0]?.message?.content || '').trim();
  }

  private parseJson<T>(raw: string): T {
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.error(`Failed to parse AI response as JSON: ${raw.slice(0, 200)}`);
      throw new Error('Invalid JSON response from AI model');
    }
  }

  async generateSegment(input: SegmentPrompt): Promise<SegmentSuggestion> {
    try {
      const system = `You are a marketing CRM assistant. Always respond with valid JSON only. No markdown, no explanation.`;
      const user = `Create a customer segment for this business goal: "${input.businessGoal}"
${input.customerSummary ? `Customer context: ${JSON.stringify(input.customerSummary)}` : ''}

Return JSON with exactly these fields:
{
  "name": "segment name",
  "description": "short description",
  "ruleJson": { only include relevant keys from: totalSpent_gte, totalSpent_lte, orderCount_gte, orderCount_lte, lastOrderDays_gte, lastOrderDays_lte, city },
  "reason": "why this segment fits the goal"
}`;

      const raw = await this.callGithubModels(system, user);
      const parsed = this.parseJson<Partial<SegmentSuggestion>>(raw);

      if (!parsed.name || !parsed.ruleJson || !parsed.reason) {
        throw new Error(`AI returned incomplete segment: ${JSON.stringify(parsed).slice(0, 200)}`);
      }

      return {
        name: String(parsed.name),
        description: String(parsed.description || ''),
        ruleJson: parsed.ruleJson as Record<string, unknown>,
        reason: String(parsed.reason),
        aiGenerated: true,
      };
    } catch (err: any) {
      this.logger.error(`${GithubModelsProvider.name}.generateSegment failed: ${err.message}${err.stack ? '\n' + err.stack.split('\n').slice(0, 2).join('\n') : ''}`);
      return this.fallback.generateSegment(input);
    }
  }

  async generateMessage(input: MessagePrompt): Promise<MessageSuggestion> {
    try {
      const system = `You are a marketing copywriter. Always respond with valid JSON only. No markdown.`;
      const user = `Write a ${input.channel} marketing message.
Segment: "${input.segmentName}"
Objective: "${input.objective}"
${input.offer ? `Offer: "${input.offer}"` : ''}
${input.tone ? `Tone: ${input.tone}` : 'Tone: friendly'}

Return JSON:
{
  "subject": "email subject or empty string",
  "body": "message body using {{name}} placeholder",
  "cta": "call to action text",
  "placeholders": ["{{name}}", "{{email}}"]
}`;

      const raw = await this.callGithubModels(system, user);
      const parsed = this.parseJson<Partial<MessageSuggestion>>(raw);

      if (!parsed.body || !parsed.cta) {
        throw new Error(`AI returned incomplete message: ${JSON.stringify(parsed).slice(0, 200)}`);
      }

      return {
        subject: String(parsed.subject || ''),
        body: String(parsed.body),
        cta: String(parsed.cta),
        placeholders: Array.isArray(parsed.placeholders) ? parsed.placeholders : ['{{name}}', '{{email}}'],
      };
    } catch (err: any) {
      this.logger.error(`${GithubModelsProvider.name}.generateMessage failed: ${err.message}${err.stack ? '\n' + err.stack.split('\n').slice(0, 2).join('\n') : ''}`);
      return this.fallback.generateMessage(input);
    }
  }

  async recommendChannel(input: ChannelRecommendationPrompt): Promise<ChannelRecommendation> {
    try {
      const system = `You are a marketing strategist. Always respond with valid JSON only. No markdown.`;
      const user = `Recommend the best channel for this campaign.
Segment: "${input.segmentName}", Objective: "${input.objective}"
${input.historicalRates ? `Historical rates: ${JSON.stringify(input.historicalRates)}` : ''}
Channels available: whatsapp, email, sms

Return JSON: { "recommendedChannel": "whatsapp|email|sms", "reason": "1-2 sentence explanation" }`;

      const raw = await this.callGithubModels(system, user);
      const parsed = this.parseJson<Partial<ChannelRecommendation>>(raw);

      const validChannels = ['whatsapp', 'email', 'sms'];
      if (!parsed.recommendedChannel || !validChannels.includes(parsed.recommendedChannel) || !parsed.reason) {
        throw new Error(`AI returned invalid channel recommendation: ${JSON.stringify(parsed).slice(0, 200)}`);
      }

      return {
        recommendedChannel: parsed.recommendedChannel,
        reason: String(parsed.reason),
      };
    } catch (err: any) {
      this.logger.error(`${GithubModelsProvider.name}.recommendChannel failed: ${err.message}${err.stack ? '\n' + err.stack.split('\n').slice(0, 2).join('\n') : ''}`);
      return this.fallback.recommendChannel(input);
    }
  }

  async generateInsights(input: InsightPrompt): Promise<InsightSummary> {
    try {
      const system = `You are a marketing analytics expert. Always respond with valid JSON only. No markdown.`;
      const user = `Analyze this campaign: "${input.campaignName}", objective: "${input.objective}"
Audience: ${input.audienceSize}, Sent: ${input.sentCount}, Delivered: ${input.deliveredCount}, Opened: ${input.openedCount}, Read: ${input.readCount}, Clicked: ${input.clickedCount}, Purchased: ${input.purchasedCount}
Revenue: $${input.revenueAttributed.toFixed(2)}
Rates: delivery=${(input.rates.deliveryRate * 100).toFixed(1)}%, open=${(input.rates.openRate * 100).toFixed(1)}%, read=${(input.rates.readRate * 100).toFixed(1)}%, click=${(input.rates.clickRate * 100).toFixed(1)}%, conversion=${(input.rates.conversionRate * 100).toFixed(1)}%

Return JSON: { "summary": "2-3 sentences", "insight": "1 key finding", "nextBestAction": "1 specific recommendation" }`;

      const raw = await this.callGithubModels(system, user);
      const parsed = this.parseJson<Partial<InsightSummary>>(raw);

      if (!parsed.summary || !parsed.insight || !parsed.nextBestAction) {
        throw new Error(`AI returned incomplete insights: ${JSON.stringify(parsed).slice(0, 200)}`);
      }

      return {
        summary: String(parsed.summary),
        insight: String(parsed.insight),
        nextBestAction: String(parsed.nextBestAction),
      };
    } catch (err: any) {
      this.logger.error(`${GithubModelsProvider.name}.generateInsights failed: ${err.message}${err.stack ? '\n' + err.stack.split('\n').slice(0, 2).join('\n') : ''}`);
      return this.fallback.generateInsights(input);
    }
  }
}
