import { CreateCustomerDto } from '../../src/modules/customers/dto/create-customer.dto';
import { CreateOrderDto } from '../../src/modules/orders/dto/create-order.dto';
import { CreateSegmentDto } from '../../src/modules/segments/dto/create-segment.dto';
import { CreateCampaignDto } from '../../src/modules/campaigns/dto/create-campaign.dto';
import { ChannelEventDto, CallbackEventType } from '../../src/modules/communications/dto/channel-event.dto';

export function buildCustomerDto(overrides: Partial<CreateCustomerDto> = {}): CreateCustomerDto {
  return {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+1-555-0000',
    city: 'New York',
    ...overrides,
  };
}

export function buildOrderDto(overrides: Partial<CreateOrderDto> = {}): CreateOrderDto {
  return {
    customerId: '00000000-0000-0000-0000-000000000001',
    orderTotal: 99.99,
    currency: 'USD',
    channel: 'website',
    status: 'completed',
    ...overrides,
  };
}

export function buildSegmentDto(overrides: Partial<CreateSegmentDto> = {}): CreateSegmentDto {
  return {
    name: 'Test Segment',
    description: 'A test segment',
    ruleJson: { city: 'New York' },
    aiGenerated: false,
    ...overrides,
  };
}

export function buildCampaignDto(overrides: Partial<CreateCampaignDto> = {}): CreateCampaignDto {
  return {
    name: 'Test Campaign',
    objective: 'Drive repeat purchases',
    segmentId: '00000000-0000-0000-0000-000000000010',
    messageTemplate: 'Hello {{name}}, check out our latest offers!',
    channel: 'email',
    ...overrides,
  };
}

export function buildCallbackDto(
  communicationId: string,
  eventType: CallbackEventType = CallbackEventType.DELIVERED,
  overrides: Partial<ChannelEventDto> = {},
): ChannelEventDto {
  return {
    communicationId,
    eventType,
    timestamp: new Date().toISOString(),
    ...overrides,
  } as ChannelEventDto;
}

export function buildMockCustomer(overrides: Record<string, any> = {}) {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+1-555-0000',
    city: 'New York',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    orders: [
      { id: 'o1', orderTotal: 149.99, orderedAt: new Date('2026-01-15'), status: 'completed' },
      { id: 'o2', orderTotal: 59.99, orderedAt: new Date('2026-02-20'), status: 'completed' },
    ],
    _count: { orders: 2 },
    ...overrides,
  };
}

export function buildMockCommunication(overrides: Record<string, any> = {}) {
  return {
    id: 'comm-001',
    campaignId: 'camp-001',
    customerId: 'cust-001',
    channel: 'email',
    messageRendered: 'Hello Alice, check out our latest offers!',
    status: 'delivered',
    sentAt: new Date('2026-06-01T10:00:00Z'),
    deliveredAt: new Date('2026-06-01T10:01:00Z'),
    openedAt: null,
    readAt: null,
    clickedAt: null,
    purchasedAt: null,
    failureReason: null,
    createdAt: new Date('2026-06-01T10:00:00Z'),
    updatedAt: new Date('2026-06-01T10:01:00Z'),
    ...overrides,
  };
}
