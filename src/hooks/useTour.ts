import { useContext } from 'react';
import { TourContext } from '@/context/TourContext';
import { TourContextValue } from '@/types/TourContext';

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return ctx;
}

export function useTourOptional(): TourContextValue | undefined {
  return useContext(TourContext);
}
