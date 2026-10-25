'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query-client';
export const Providers = ({ children }: { children: ReactNode }) => {
  // One client per browser tab; on the server every request renders a fresh tree.
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
