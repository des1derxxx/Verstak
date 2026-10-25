import axios from 'axios';
import type { AxiosError, Method } from 'axios';
let csrfToken = '';
export const setCsrf = (value: string): void => {
  csrfToken = value;
};
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
  responseType: 'json',
  transitional: { silentJSONParsing: false },
  headers: { 'X-Verstak-Client': 'web' },
});
http.interceptors.request.use((config) => {
  if (csrfToken) config.headers.set('X-CSRF-Token', csrfToken);
  return config;
});
const errorMessage = (detail: unknown): string => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const field = detail[0]?.loc?.at(-1) ?? 'данные';
    return `Проверь поле «${field}»: ${detail[0]?.msg ?? 'некорректное значение'}`;
  }
  return 'Сервер не смог выполнить запрос.';
};
const normalizeError = (
  error: AxiosError<{
    detail?: unknown;
  }>,
): ApiError => {
  if (error.code === 'ERR_BAD_RESPONSE' && (!error.response || error.response.status < 400)) {
    return new ApiError(502, 'Сервер вернул неожиданный ответ. Повтори запрос позже.');
  }
  if (!error.response) {
    return new ApiError(
      0,
      'Не удалось связаться с сервером. Проверь подключение и повтори действие.',
    );
  }
  const status = error.response.status;
  const isAuthRequest = error.config?.url?.startsWith('/auth/');
  if (status === 401 && !isAuthRequest && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('verstak:unauthorized'));
  }
  return new ApiError(status, errorMessage(error.response.data?.detail));
};
http.interceptors.response.use(
  (response) => response,
  (
    error: AxiosError<{
      detail?: unknown;
    }>,
  ) => Promise.reject(normalizeError(error)),
);
export const api = async <T>(path: string, method: Method = 'GET', body?: unknown): Promise<T> => {
  const response = await http.request<T>({ url: path, method, data: body });
  return response.status === 204 ? (undefined as T) : response.data;
};
