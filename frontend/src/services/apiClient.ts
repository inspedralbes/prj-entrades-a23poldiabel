import { useRuntimeConfig, useCookie } from '#app';

function getAuthHeader(): Record<string, string> {
  const token = useCookie('auth_token');
  return token.value ? { Authorization: `Bearer ${token.value}` } : {};
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private getBaseUrl() {
    const config = useRuntimeConfig();
    const base = (config.public.apiUrl || 'http://localhost:3000').replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }

  private normalizeEndpoint(endpoint: string): string {
    const withLeadingSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (withLeadingSlash === '/api') {
      return '';
    }
    return withLeadingSlash.startsWith('/api/') ? withLeadingSlash.slice(4) : withLeadingSlash;
  }

  private async request<T>(endpoint: string, options: Options = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const resposta = await fetch(`${this.getBaseUrl()}${this.normalizeEndpoint(endpoint)}`, config);

    if (!resposta.ok) {
      const error = await resposta.json().catch(() => ({ missatge: 'Error desconegut' }));
      throw new Error(error.missatge || error.error || `Error ${resposta.status}`);
    }

    return resposta.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();