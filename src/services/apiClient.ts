import { getApiBaseUrls } from '@/config';

const DEFAULT_TIMEOUT_MS = 8000;

function getTimeoutMs(path: string): number {
  if (path.includes('/chapters/') && !path.endsWith('/chapters/')) {
    return 60000;
  }
  if (path.includes('/audio/')) {
    return 45000;
  }
  return DEFAULT_TIMEOUT_MS;
}

/** Turn `/api/...` into a full URL the device can fetch (required for audio playback). */
export function resolveApiUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const base = getApiBaseUrls()[0] ?? 'https://quran-beige-xi.vercel.app';
  return `${base}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithBaseUrl(path: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown = null;

  const timeoutMs = getTimeoutMs(path);

  for (const baseUrl of getApiBaseUrls()) {
    try {
      return await fetchWithTimeout(`${baseUrl}${path}`, init, timeoutMs);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to reach backend for ${path}`);
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithBaseUrl(path, init);

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Request failed for ${path}: ${response.status}${message ? ` - ${message}` : ''}`);
  }

  return (await response.json()) as T;
}

export async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await fetchWithBaseUrl(path, init);

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Request failed for ${path}: ${response.status}${message ? ` - ${message}` : ''}`);
  }
}