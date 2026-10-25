import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
// Shared by the browser provider and server-side prefetching, so it must not be a client module.
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Client errors (403, 404, validation) will not fix themselves on retry.
        retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
      },
    },
  });
