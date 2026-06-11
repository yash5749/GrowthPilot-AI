const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function fetchJson<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

async function uploadFile<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  health: () => fetchJson<{ status: string }>("/health"),

  customers: {
    list: (search?: string, page = 1, limit = 20) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      return fetchJson<import("./types").PaginatedResponse<import("./types").Customer>>(`/customers?${params}`);
    },
    get: (id: string) => fetchJson<import("./types").Customer>(`/customers/${id}`),
    create: (data: { name: string; email: string; phone?: string; city?: string }) =>
      fetchJson<import("./types").Customer>("/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    import: (file: File) => uploadFile<import("./types").ImportResult>("/customers/import", file),
  },

  orders: {
    list: (page = 1, limit = 20) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      return fetchJson<import("./types").PaginatedResponse<import("./types").Order>>(`/orders?${params}`);
    },
    create: (data: { customerId: string; orderTotal: number; channel: string; status: string; currency?: string }) =>
      fetchJson<import("./types").Order>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    import: (file: File) => uploadFile<import("./types").ImportResult>("/orders/import", file),
  },

  segments: {
    list: () => fetchJson<import("./types").Segment[]>("/segments"),
    get: (id: string) => fetchJson<import("./types").Segment>(`/segments/${id}`),
    create: (data: import("./types").CreateSegmentDto) =>
      fetchJson<import("./types").Segment>("/segments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    preview: (id: string) =>
      fetchJson<{ segment: import("./types").Segment; count: number; customers: import("./types").Customer[] }>(
        `/segments/${id}/preview`,
        { method: "POST" }
      ),
    aiSuggest: (businessGoal: string) =>
      fetchJson<import("./types").SegmentSuggestion>("/segments/ai-suggest", {
        method: "POST",
        body: JSON.stringify({ businessGoal }),
      }),
  },

  campaigns: {
    list: () => fetchJson<import("./types").Campaign[]>("/campaigns"),
    get: (id: string) => fetchJson<import("./types").Campaign>(`/campaigns/${id}`),
    create: (data: import("./types").CreateCampaignDto) =>
      fetchJson<import("./types").Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approve: (id: string) =>
      fetchJson<import("./types").Campaign>(`/campaigns/${id}/approve`, { method: "POST" }),
    send: (id: string) =>
      fetchJson<{ campaign: import("./types").Campaign; audienceSize: number }>(`/campaigns/${id}/send`, {
        method: "POST",
      }),
  },

  communications: {
    list: () => fetchJson<import("./types").Communication[]>("/communications"),
    listByCampaign: (campaignId: string) =>
      fetchJson<import("./types").Communication[]>(`/campaigns/${campaignId}/communications`),
  },

  analytics: {
    dashboard: () => fetchJson<import("./types").DashboardAnalytics>("/analytics/dashboard"),
    campaign: (id: string) => fetchJson<import("./types").CampaignAnalytics>(`/analytics/campaigns/${id}`),
  },

  ai: {
    suggestSegment: (data: import("./types").AiSegmentDto) =>
      fetchJson<import("./types").SegmentSuggestion>("/ai/segment", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    generateMessage: (data: import("./types").AiMessageDto) =>
      fetchJson<import("./types").MessageSuggestion>("/ai/message", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    recommendChannel: (data: import("./types").AiChannelRecommendationDto) =>
      fetchJson<import("./types").ChannelRecommendation>("/ai/recommend-channel", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    generateInsights: (data: import("./types").AiInsightsDto) =>
      fetchJson<import("./types").InsightSummary>("/ai/insights", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
