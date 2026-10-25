import { AxiosError } from 'axios';
import { http } from '../src/shared/api/client.ts';

// Exercise the actual Axios interceptors and JSON transforms without network access.
export const mockApi = (context, handler) => {
  const previous = http.defaults.adapter;
  const calls = [];
  let implementation = handler;
  http.defaults.adapter = async (config) => {
    const url = `${config.baseURL}${config.url}`;
    const options = {
      method: config.method.toUpperCase(),
      headers: config.headers.toJSON(),
      body: config.data,
      withCredentials: config.withCredentials,
    };
    calls.push([url, options]);
    const result = await implementation(url, options);
    const response = {
      data: await result.text(),
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers),
      config,
      request: {},
    };
    if (response.status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, {}, response);
    }
    return response;
  };
  context.after(() => {
    http.defaults.adapter = previous;
  });
  return {
    calls,
    mock: {
      callCount: () => calls.length,
      mockImplementation: (next) => {
        implementation = next;
      },
    },
  };
};
