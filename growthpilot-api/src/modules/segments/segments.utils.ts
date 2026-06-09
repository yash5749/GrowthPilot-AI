export interface SegmentRule {
  city?: string;
  city_in?: string[];
  totalSpent_gte?: number;
  totalSpent_lte?: number;
  orderCount_gte?: number;
  orderCount_lte?: number;
  lastOrderDays_gte?: number;
  lastOrderDays_lte?: number;
}

export function evaluateCustomer(customer: any, rule: SegmentRule): boolean {
  if (rule.city && customer.city !== rule.city) return false;
  
  if (rule.city_in && rule.city_in.length > 0) {
    if (!customer.city || !rule.city_in.includes(customer.city)) return false;
  }

  const orders = customer.orders || [];
  const orderCount = orders.length;
  const totalSpent = orders.reduce((sum: number, o: any) => sum + o.orderTotal, 0);

  if (rule.orderCount_gte !== undefined && orderCount < rule.orderCount_gte) return false;
  if (rule.orderCount_lte !== undefined && orderCount > rule.orderCount_lte) return false;

  if (rule.totalSpent_gte !== undefined && totalSpent < rule.totalSpent_gte) return false;
  if (rule.totalSpent_lte !== undefined && totalSpent > rule.totalSpent_lte) return false;

  if (rule.lastOrderDays_gte !== undefined || rule.lastOrderDays_lte !== undefined) {
    if (orders.length === 0) {
      return false; // No orders placed, so cannot check last order days
    }
    const orderTimes = orders.map((o: any) => new Date(o.orderedAt).getTime());
    const lastOrderTime = Math.max(...orderTimes);
    const diffTime = Math.abs(Date.now() - lastOrderTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (rule.lastOrderDays_gte !== undefined && diffDays < rule.lastOrderDays_gte) return false;
    if (rule.lastOrderDays_lte !== undefined && diffDays > rule.lastOrderDays_lte) return false;
  }

  return true;
}
