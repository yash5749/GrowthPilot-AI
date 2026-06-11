// ─── Input types ────────────────────────────────────────────────────────────

export interface SegmentPrompt {
  businessGoal: string;
  customerSummary?: {
    totalCustomers: number;
    avgOrderValue?: number;
    topCities?: string[];
  };
}

export interface MessagePrompt {
  segmentName: string;
  segmentDescription?: string;
  channel: string;
  objective: string;
  offer?: string;
  tone?: string;
}

export interface ChannelRecommendationPrompt {
  segmentName: string;
  audienceSize?: number;
  objective: string;
  historicalRates?: {
    whatsapp?: { deliveryRate: number; openRate: number };
    email?: { deliveryRate: number; openRate: number };
    sms?: { deliveryRate: number; openRate: number };
  };
}

export interface InsightPrompt {
  campaignName: string;
  objective: string;
  audienceSize: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  readCount: number;
  clickedCount: number;
  purchasedCount: number;
  revenueAttributed: number;
  rates: {
    deliveryRate: number;
    openRate: number;
    readRate: number;
    clickRate: number;
    conversionRate: number;
  };
}

// ─── Output types ───────────────────────────────────────────────────────────

export interface SegmentSuggestion {
  name: string;
  description: string;
  ruleJson: Record<string, unknown>;
  reason: string;
  aiGenerated: true;
}

export interface MessageSuggestion {
  subject: string;
  body: string;
  cta: string;
  placeholders: string[];
}

export interface ChannelRecommendation {
  recommendedChannel: string;
  reason: string;
}

export interface InsightSummary {
  summary: string;
  insight: string;
  nextBestAction: string;
}

// ─── Provider interface ─────────────────────────────────────────────────────

export interface AiProvider {
  generateSegment(input: SegmentPrompt): Promise<SegmentSuggestion>;
  generateMessage(input: MessagePrompt): Promise<MessageSuggestion>;
  recommendChannel(input: ChannelRecommendationPrompt): Promise<ChannelRecommendation>;
  generateInsights(input: InsightPrompt): Promise<InsightSummary>;
}

// ─── Injection token ─────────────────────────────────────────────────────────

export const AI_PROVIDER = 'AI_PROVIDER';
