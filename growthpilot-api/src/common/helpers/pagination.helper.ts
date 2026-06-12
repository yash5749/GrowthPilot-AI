export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPagination(query?: {
  page?: string;
  limit?: string;
}): PaginationParams {
  const page = Math.max(1, query?.page ? parseInt(query.page, 10) || 1 : 1);
  const limit = Math.max(1, Math.min(100, query?.limit ? parseInt(query.limit, 10) || 20 : 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit) || 1,
    },
  };
}
