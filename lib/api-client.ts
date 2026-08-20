const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://logistica-es0n.onrender.com';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${BASE_URL}/${cleanPath}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
  });

  // Handle No Content response
  if (response.status === 204) {
    return {} as T;
  }

  let responseData: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json().catch(() => null);
  } else {
    responseData = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const errorMessage =
      responseData?.detail ||
      responseData?.message ||
      (typeof responseData === 'string' ? responseData : `Request failed with status ${response.status}`);
    
    throw new ApiError(errorMessage, response.status, responseData);
  }

  return responseData as T;
}
