export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  metrics?: CustomerMetrics;
}

export interface CustomerMetrics {
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  lastOrderAt?: string | null;
}

export interface Order {
  id: string;
  customerId: string;
  customer?: { id: string; name: string; email: string };
  orderTotal: number;
  currency: string;
  orderedAt: string;
  channel: string;
  status: string;
  createdAt: string;
}

export interface Segment {
  id: string;
  name: string;
  description?: string | null;
  ruleJson: Record<string, unknown>;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  campaigns?: Campaign[];
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  segmentId: string;
  segment?: { id: string; name: string };
  messageTemplate: string;
  channel: string;
  status: CampaignStatus;
  createdAt: string;
  sentAt?: string | null;
  updatedAt: string;
}

export type CampaignStatus = "draft" | "approved" | "sent";

export interface Communication {
  id: string;
  campaignId: string;
  customerId: string;
  customer?: { id: string; name: string; email: string };
  channel: string;
  messageRendered: string;
  status: CommunicationStatus;
  sentAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
  clickedAt?: string | null;
  purchasedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

export type CommunicationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "opened"
  | "clicked"
  | "purchased";

export interface CommunicationEvent {
  id: string;
  communicationId: string;
  eventType: string;
  payloadJson?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardAnalytics {
  totalCustomers: number;
  totalOrders: number;
  activeSegments: number;
  campaignsSent: number;
  aggregateCounters: {
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    openedCount: number;
    clickedCount: number;
    purchasedCount: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  revenueAttributed: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  objective: string;
  status: string;
  audienceSize: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  purchasedCount: number;
  revenueAttributed: number;
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SegmentSuggestion {
  name: string;
  ruleJson: Record<string, unknown>;
  reason: string;
  aiGenerated: boolean;
}

export interface CreateCampaignDto {
  name: string;
  objective: string;
  segmentId: string;
  messageTemplate: string;
  channel: string;
}

export interface CreateSegmentDto {
  name: string;
  description?: string;
  ruleJson: Record<string, unknown>;
  aiGenerated?: boolean;
}
