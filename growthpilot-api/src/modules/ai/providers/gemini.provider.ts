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
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly fallback: MockAiProvider;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
    this.fallback = new MockAiProvider();
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — GeminiProvider will fall back to mock responses.');
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No Gemini API key configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as any;
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.trim();
  }

  private parseJson<T>(raw: string, fallbackValue: T): T {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.warn(`Failed to parse AI JSON response. Raw: ${raw.slice(0, 200)}`);
      return fallbackValue;
    }
  }

  async generateSegment(input: SegmentPrompt): Promise<SegmentSuggestion> {
    try {
      const prompt = `You are a marketing CRM assistant. Given a business goal, return a customer segment definition as JSON.

Business goal: "${input.businessGoal}"
${input.customerSummary ? `Context: ${JSON.stringify(input.customerSummary)}` : ''}

Respond ONLY with a JSON object in this exact shape:
{
  "name": "string",
  "description": "string",
  "ruleJson": {
    "totalSpent_gte": number | undefined,
    "totalSpent_lte": number | undefined,
    "orderCount_gte": number | undefined,
    "orderCount_lte": number | undefined,
    "lastOrderDays_gte": number | undefined,
    "lastOrderDays_lte": number | undefined,
    "city": "string | undefined"
  },
  "reason": "string"
}

Rules available for ruleJson: totalSpent_gte, totalSpent_lte, orderCount_gte, orderCount_lte, lastOrderDays_gte, lastOrderDays_lte, city. Only include relevant rules. Do not include undefined keys.`;

      const raw = await this.callGemini(prompt);
      const parsed = this.parseJson<Partial<SegmentSuggestion>>(raw, {});

      // Validate required fields
      if (!parsed.name || !parsed.ruleJson || !parsed.reason) {
        this.logger.warn('Gemini returned incomplete segment suggestion, using mock fallback');
        return this.fallback.generateSegment(input);
      }

      return {
        name: String(parsed.name),
        description: String(parsed.description || ''),
        ruleJson: parsed.ruleJson as Record<string, unknown>,
        reason: String(parsed.reason),
        aiGenerated: true,
      };
    } catch (err: any) {
      this.logger.error(`GeminiProvider.generateSegment error: ${err.message}`);
      return this.fallback.generateSegment(input);
    }
  }

  async generateMessage(input: MessagePrompt): Promise<MessageSuggestion> {
    try {
      const prompt = `You are a marketing copywriter. Write a ${input.channel} message for a campaign.

Segment: "${input.segmentName}"
${input.segmentDescription ? `Segment description: "${input.segmentDescription}"` : ''}
Channel: ${input.channel}
Objective: "${input.objective}"
${input.offer ? `Offer: "${input.offer}"` : ''}
${input.tone ? `Tone: ${input.tone}` : 'Tone: friendly and engaging'}

Respond ONLY with a JSON object:
{
  "subject": "email subject line (empty string for whatsapp/sms)",
  "body": "message body with {{name}} placeholder",
  "cta": "call to action text",
  "placeholders": ["{{name}}", "{{email}}"]
}

Keep the body concise and appropriate for the channel. Use {{name}} naturally.`;

      const raw = await this.callGemini(prompt);
      const parsed = this.parseJson<Partial<MessageSuggestion>>(raw, {});

      if (!parsed.body || !parsed.cta) {
        return this.fallback.generateMessage(input);
      }

      return {
        subject: String(parsed.subject || ''),
        body: String(parsed.body),
        cta: String(parsed.cta),
        placeholders: Array.isArray(parsed.placeholders) ? parsed.placeholders : ['{{name}}', '{{email}}'],
      };
    } catch (err: any) {
      this.logger.error(`GeminiProvider.generateMessage error: ${err.message}`);
      return this.fallback.generateMessage(input);
    }
  }

  async recommendChannel(input: ChannelRecommendationPrompt): Promise<ChannelRecommendation> {
    try {
      const prompt = `You are a marketing channel strategist. Recommend the best outreach channel.

Segment: "${input.segmentName}"
${input.audienceSize ? `Audience size: ${input.audienceSize}` : ''}
Campaign objective: "${input.objective}"
${input.historicalRates ? `Historical performance data: ${JSON.stringify(input.historicalRates)}` : ''}

Available channels: whatsapp, email, sms

Respond ONLY with a JSON object:
{
  "recommendedChannel": "whatsapp" | "email" | "sms",
  "reason": "string explaining the recommendation in 1-2 sentences"
}`;

      const raw = await this.callGemini(prompt);
      const parsed = this.parseJson<Partial<ChannelRecommendation>>(raw, {});

      const validChannels = ['whatsapp', 'email', 'sms'];
      if (!parsed.recommendedChannel || !validChannels.includes(parsed.recommendedChannel) || !parsed.reason) {
        return this.fallback.recommendChannel(input);
      }

      return {
        recommendedChannel: parsed.recommendedChannel,
        reason: String(parsed.reason),
      };
    } catch (err: any) {
      this.logger.error(`GeminiProvider.recommendChannel error: ${err.message}`);
      return this.fallback.recommendChannel(input);
    }
  }

  async generateInsights(input: InsightPrompt): Promise<InsightSummary> {
    try {
      const prompt = `You are a marketing analytics expert. Analyze these campaign results and provide insights.

Campaign: "${input.campaignName}"
Objective: "${input.objective}"
Audience size: ${input.audienceSize}
Sent: ${input.sentCount}, Delivered: ${input.deliveredCount}, Opened: ${input.openedCount}, Read: ${input.readCount}, Clicked: ${input.clickedCount}, Purchased: ${input.purchasedCount}
Revenue attributed: $${input.revenueAttributed.toFixed(2)}
Rates: delivery=${(input.rates.deliveryRate * 100).toFixed(1)}%, open=${(input.rates.openRate * 100).toFixed(1)}%, read=${(input.rates.readRate * 100).toFixed(1)}%, click=${(input.rates.clickRate * 100).toFixed(1)}%, conversion=${(input.rates.conversionRate * 100).toFixed(1)}%

Respond ONLY with a JSON object:
{
  "summary": "2-3 sentence summary of campaign performance",
  "insight": "1 key finding or interpretation",
  "nextBestAction": "1 specific, actionable recommendation"
}`;

      const raw = await this.callGemini(prompt);
      const parsed = this.parseJson<Partial<InsightSummary>>(raw, {});

      if (!parsed.summary || !parsed.insight || !parsed.nextBestAction) {
        return this.fallback.generateInsights(input);
      }

      return {
        summary: String(parsed.summary),
        insight: String(parsed.insight),
        nextBestAction: String(parsed.nextBestAction),
      };
    } catch (err: any) {
      this.logger.error(`GeminiProvider.generateInsights error: ${err.message}`);
      return this.fallback.generateInsights(input);
    }
  }
}
