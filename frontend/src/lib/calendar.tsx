'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { localDate } from '@/lib/model/workspace';
export type Calendar = { today: string; timeZone: string };
export const CalendarContext = createContext<Calendar | null>(null);
export const useCalendar = () =>
  useContext(CalendarContext) ?? { today: localDate(), timeZone: 'UTC' };
// Hydrate with the server's clock first, then switch to the browser's timezone.
const useBrowserCalendar = (initial: Calendar) => {
  const [calendar, setCalendar] = useState(initial);
  useEffect(() => {
    const update = () =>
      setCalendar({
        today: localDate(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  return calendar;
};
export const CalendarProvider = ({
  initial,
  children,
}: {
  initial: Calendar;
  children: ReactNode;
}) => (
  <CalendarContext.Provider value={useBrowserCalendar(initial)}>
    {children}
  </CalendarContext.Provider>
);
