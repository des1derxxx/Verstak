'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
type Props = ComponentProps<typeof Link> & { navigate?: (href: string) => void };
export const RouteLink = ({ navigate, onClick, ...props }: Props) => (
  <Link
    {...props}
    onClick={(event) => {
      onClick?.(event);
      if (
        !navigate ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      navigate(String(props.href));
    }}
  />
);
