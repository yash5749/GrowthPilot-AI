import { MockAiProvider } from './mock-ai.provider';
import { SegmentPrompt, MessagePrompt, ChannelRecommendationPrompt, InsightPrompt } from './ai-provider.interface';

describe('MockAiProvider', () => {
  let provider: MockAiProvider;

  beforeEach(() => {
    provider = new MockAiProvider();
  });

  describe('generateSegment', () => {
    it('returns VIP suggestion when goal mentions vip', async () => {
      const result = await provider.generateSegment({ businessGoal: 'Find VIP customers' });

      expect(result.name).toContain('High Value');
      expect(result.aiGenerated).toBe(true);
      expect(result.ruleJson).toBeDefined();
    });

    it('returns lapsed suggestion when goal mentions inactive', async () => {
      const result = await provider.generateSegment({ businessGoal: 'Re-engage inactive customers' });

      expect(result.name).toContain('Lapsed');
      expect(result.reason).toContain('reactivation');
    });

    it('returns new shopper suggestion for onboarding goals', async () => {
      const result = await provider.generateSegment({ businessGoal: 'Onboard new customers' });

      expect(result.name).toContain('First-Time');
    });

    it('returns city-based suggestion for local goals', async () => {
      const result = await provider.generateSegment({ businessGoal: 'Target shoppers in a specific city for a local event' });

      expect(result.name).toContain('New York City');
    });

    it('returns default reactivation audience for generic goals', async () => {
      const result = await provider.generateSegment({ businessGoal: 'Boost sales' });

      expect(result.name).toBe('Reactivation Audience');
    });
  });

  describe('generateMessage', () => {
    it('generates email template with subject', async () => {
      const result = await provider.generateMessage({
        segmentName: 'VIP',
        channel: 'email',
        objective: 'Drive repeat purchases',
      });

      expect(result.subject).toBeTruthy();
      expect(result.body).toContain('{{name}}');
      expect(result.cta).toBe('Shop Now');
      expect(result.placeholders).toContain('{{name}}');
    });

    it('generates WhatsApp template without subject', async () => {
      const result = await provider.generateMessage({
        segmentName: 'VIP',
        channel: 'whatsapp',
        objective: 'Drive sales',
      });

      expect(result.subject).toBe('');
      expect(result.body).toContain('{{name}}');
      expect(result.cta).toBe('Claim Now →');
    });

    it('generates SMS template', async () => {
      const result = await provider.generateMessage({
        segmentName: 'VIP',
        channel: 'sms',
        objective: 'Announce sale',
      });

      expect(result.subject).toBe('');
      expect(result.body).toContain('{{name}}');
      expect(result.body).toContain('STOP');
    });

    it('defaults to email for unknown channels', async () => {
      const result = await provider.generateMessage({
        segmentName: 'Test',
        channel: 'unknown',
        objective: 'Test',
      });

      expect(result.subject).toBeTruthy(); // Falls back to email
    });
  });

  describe('recommendChannel', () => {
    it('uses historical rates when available', async () => {
      const result = await provider.recommendChannel({
        segmentName: 'VIP',
        objective: 'Drive sales',
        historicalRates: {
          email: { deliveryRate: 0.9, openRate: 0.3 },
          sms: { deliveryRate: 0.95, openRate: 0.5 },
        },
      });

      expect(result.recommendedChannel).toBe('sms');
      expect(result.reason).toContain('historical performance');
    });

    it('recommends SMS for urgent campaigns', async () => {
      const result = await provider.recommendChannel({
        segmentName: 'Test',
        objective: 'Flash sale — limited time only',
      });

      expect(result.recommendedChannel).toBe('sms');
    });

    it('recommends email for brand campaigns', async () => {
      const result = await provider.recommendChannel({
        segmentName: 'Test',
        objective: 'Share brand story',
      });

      expect(result.recommendedChannel).toBe('email');
    });

    it('defaults to WhatsApp', async () => {
      const result = await provider.recommendChannel({
        segmentName: 'Test',
        objective: 'General outreach',
      });

      expect(result.recommendedChannel).toBe('whatsapp');
    });
  });

  describe('generateInsights', () => {
    it('generates insight summary from campaign data', async () => {
      const result = await provider.generateInsights({
        campaignName: 'Test Campaign',
        objective: 'Drive sales',
        audienceSize: 100,
        sentCount: 100,
        deliveredCount: 95,
        openedCount: 60,
        readCount: 40,
        clickedCount: 20,
        purchasedCount: 10,
        revenueAttributed: 5000,
        rates: {
          deliveryRate: 0.95,
          openRate: 0.63,
          readRate: 0.67,
          clickRate: 0.33,
          conversionRate: 0.10,
        },
      });

      expect(result.summary).toContain('Test Campaign');
      expect(result.summary).toContain('100');
      expect(result.insight).toBeTruthy();
      expect(result.nextBestAction).toBeTruthy();
    });

    it('reports high conversion insight', async () => {
      const result = await provider.generateInsights({
        campaignName: 'Test',
        objective: 'Test',
        audienceSize: 50,
        sentCount: 50,
        deliveredCount: 45,
        openedCount: 30,
        readCount: 25,
        clickedCount: 15,
        purchasedCount: 10,
        revenueAttributed: 2000,
        rates: {
          deliveryRate: 0.9,
          openRate: 0.67,
          readRate: 0.83,
          clickRate: 0.5,
          conversionRate: 0.20,
        },
      });

      expect(result.insight).toContain('Exceptional');
      expect(result.nextBestAction).toContain('Replicate');
    });

    it('reports low delivery insight', async () => {
      const result = await provider.generateInsights({
        campaignName: 'Test',
        objective: 'Test',
        audienceSize: 50,
        sentCount: 50,
        deliveredCount: 25,
        openedCount: 15,
        readCount: 10,
        clickedCount: 5,
        purchasedCount: 2,
        revenueAttributed: 100,
        rates: {
          deliveryRate: 0.5,
          openRate: 0.6,
          readRate: 0.67,
          clickRate: 0.33,
          conversionRate: 0.04,
        },
      });

      expect(result.insight).toContain('below expectations');
    });
  });
});
