import { Injectable } from '@nestjs/common';
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

@Injectable()
export class MockAiProvider implements AiProvider {
  async generateSegment(input: SegmentPrompt): Promise<SegmentSuggestion> {
    const goal = (input.businessGoal || '').toLowerCase();

    if (goal.includes('vip') || goal.includes('high value') || goal.includes('loyal')) {
      return {
        name: 'High Value Loyal Customers',
        description: 'Customers who have spent heavily and placed multiple orders',
        ruleJson: { totalSpent_gte: 300, orderCount_gte: 2 },
        reason:
          'These shoppers demonstrate strong purchase intent and high lifetime value — ideal targets for loyalty rewards.',
        aiGenerated: true,
      };
    }

    if (goal.includes('dormant') || goal.includes('inactive') || goal.includes('lapsed') || goal.includes('re-engage')) {
      return {
        name: 'Lapsed High-Spend Shoppers',
        description: 'Previously active high-value customers who have not ordered recently',
        ruleJson: { totalSpent_gte: 100, lastOrderDays_gte: 60 },
        reason:
          'These customers have proven purchase history but went silent — a targeted reactivation offer can recover them cost-effectively.',
        aiGenerated: true,
      };
    }

    if (goal.includes('new') || goal.includes('recent') || goal.includes('onboard')) {
      return {
        name: 'Recent First-Time Shoppers',
        description: 'Customers who placed their first order in the last 30 days',
        ruleJson: { orderCount_gte: 1, lastOrderDays_lte: 30 },
        reason:
          'New shoppers are in the honeymoon phase — nurturing them early significantly improves long-term retention.',
        aiGenerated: true,
      };
    }

    if (goal.includes('city') || goal.includes('local') || goal.includes('region')) {
      return {
        name: 'New York City Shoppers',
        description: 'Active customers located in New York',
        ruleJson: { city: 'New York', orderCount_gte: 1 },
        reason:
          'City-targeted campaigns enable localized offers, events, and promotions that feel personal and relevant.',
        aiGenerated: true,
      };
    }

    // Default: broad re-engagement
    return {
      name: 'Reactivation Audience',
      description: 'Customers who have not ordered recently but have prior spend history',
      ruleJson: { totalSpent_gte: 50, lastOrderDays_gte: 45 },
      reason:
        'Based on your goal, targeting customers who have demonstrated spend intent but gone quiet is the highest-leverage audience.',
      aiGenerated: true,
    };
  }

  async generateMessage(input: MessagePrompt): Promise<MessageSuggestion> {
    const { channel, segmentName, objective, offer, tone } = input;
    const toneWord = tone || 'friendly';
    const offerText = offer || 'an exclusive deal';

    const channelMap: Record<string, { subject: string; body: string; cta: string }> = {
      whatsapp: {
        subject: '',
        body: `Hey {{name}}! 👋 We have ${offerText} just for you as one of our ${segmentName} members.\n\nDon't miss out — this is your chance to ${objective.toLowerCase()}.\n\nTap below to claim your reward! 🎁`,
        cta: 'Claim Now →',
      },
      email: {
        subject: `Exclusive offer for our ${segmentName} members`,
        body: `Hi {{name}},\n\nWe're reaching out because you're part of our valued ${segmentName} group.\n\nWe have ${offerText} waiting just for you. Our goal: ${objective}.\n\nClick below to take advantage of this ${toneWord} offer before it expires.\n\nBest,\nThe GrowthPilot Team`,
        cta: 'Shop Now',
      },
      sms: {
        subject: '',
        body: `Hi {{name}}! ${offerText} for ${segmentName} members only. ${objective}. Reply STOP to opt out.`,
        cta: 'Visit our store',
      },
    };

    const template = channelMap[channel] || channelMap.email;

    return {
      subject: template.subject,
      body: template.body,
      cta: template.cta,
      placeholders: ['{{name}}', '{{email}}'],
    };
  }

  async recommendChannel(input: ChannelRecommendationPrompt): Promise<ChannelRecommendation> {
    const { objective, historicalRates } = input;
    const objLower = (objective || '').toLowerCase();

    // Pick the historically best-performing channel if data is available
    if (historicalRates) {
      let best = { channel: 'whatsapp', openRate: 0 };
      for (const [ch, rates] of Object.entries(historicalRates)) {
        if (rates && rates.openRate > best.openRate) {
          best = { channel: ch, openRate: rates.openRate };
        }
      }
      if (best.openRate > 0) {
        return {
          recommendedChannel: best.channel,
          reason: `Based on historical performance, ${best.channel} achieves the highest open rate (${(best.openRate * 100).toFixed(1)}%) for this audience, making it the optimal choice for "${objective}".`,
        };
      }
    }

    // Heuristic fallback based on objective keywords
    if (objLower.includes('urgent') || objLower.includes('flash') || objLower.includes('limited')) {
      return {
        recommendedChannel: 'sms',
        reason: 'SMS is optimal for time-sensitive campaigns — it delivers instantly with high visibility and no inbox clutter.',
      };
    }

    if (objLower.includes('brand') || objLower.includes('story') || objLower.includes('newsletter') || objLower.includes('content')) {
      return {
        recommendedChannel: 'email',
        reason: 'Email allows rich content and storytelling, making it ideal for brand-building and educational campaigns.',
      };
    }

    return {
      recommendedChannel: 'whatsapp',
      reason: 'WhatsApp delivers consistently high open rates (85%+) and feels personal — the best default for direct customer outreach.',
    };
  }

  async generateInsights(input: InsightPrompt): Promise<InsightSummary> {
    const { deliveryRate, openRate, readRate, clickRate, conversionRate } = input.rates;
    const { campaignName, purchasedCount, revenueAttributed, audienceSize, readCount } = input;

    const deliveryPct = (deliveryRate * 100).toFixed(1);
    const openPct = (openRate * 100).toFixed(1);
    const readPct = (readRate * 100).toFixed(1);
    const clickPct = (clickRate * 100).toFixed(1);
    const convPct = (conversionRate * 100).toFixed(1);

    const summary = `${campaignName} reached ${audienceSize} shoppers with a ${deliveryPct}% delivery rate. Of those delivered, ${openPct}% opened, ${readPct}% read, ${clickPct}% clicked, and ${convPct}% converted to a purchase — generating $${revenueAttributed.toFixed(2)} in attributed revenue across ${purchasedCount} purchases.`;

    let insight = '';
    let nextBestAction = '';

    if (conversionRate > 0.15) {
      insight = 'Exceptional conversion rate — this campaign significantly outperformed typical benchmarks (5–10%).';
      nextBestAction = 'Replicate this campaign for adjacent segments (e.g., increase totalSpent threshold) to extend the winning formula.';
    } else if (openRate > 0.5 && readRate < 0.3) {
      insight = 'Strong open rates indicate good message relevance, but low read-through suggests the message content needs to be more engaging.';
      nextBestAction = 'A/B test the message body length and format. Consider adding bullet points or a clearer value proposition upfront.';
    } else if (openRate > 0.5 && clickRate < 0.1) {
      insight = 'Strong open rates indicate good message relevance, but low click-through suggests the CTA or landing experience needs optimization.';
      nextBestAction = 'A/B test the CTA copy and destination URL. Consider adding urgency ("Ends tonight") to boost click-through.';
    } else if (deliveryRate < 0.6) {
      insight = 'Delivery rate is below expectations, suggesting channel quality or contact list issues.';
      nextBestAction = 'Audit the customer contact data for the segment. Consider switching to email for better deliverability, or cleaning the phone list.';
    } else if (openRate < 0.2) {
      insight = 'Low open rate suggests the message timing or first-line preview is not compelling enough.';
      nextBestAction = 'Try sending at a different time of day (Tuesday–Thursday 10am–2pm local tend to outperform) and rewrite the message opener.';
    } else {
      insight = 'Campaign performance is in healthy range across the funnel.';
      nextBestAction = `To improve conversion, add a personalized discount or social proof element. Consider a follow-up campaign for the ${audienceSize - purchasedCount} customers who did not purchase.`;
    }

    return { summary, insight, nextBestAction };
  }
}
