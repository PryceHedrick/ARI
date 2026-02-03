import { useQuery } from '@tanstack/react-query';
import {
  getValueAnalytics,
  getValueDaily,
  getValueToday,
  getValueWeekly,
} from '../api/client';

/**
 * Hook for fetching value analytics summary
 */
export function useValueAnalytics() {
  return useQuery({
    queryKey: ['value-analytics'],
    queryFn: getValueAnalytics,
    refetchInterval: 60000, // Every minute
  });
}

/**
 * Hook for fetching daily value breakdown
 */
export function useValueDaily(days: number = 7) {
  return useQuery({
    queryKey: ['value-daily', days],
    queryFn: () => getValueDaily(days),
    refetchInterval: 60000,
  });
}

/**
 * Hook for fetching today's value progress
 */
export function useValueToday() {
  return useQuery({
    queryKey: ['value-today'],
    queryFn: getValueToday,
    refetchInterval: 30000, // Every 30 seconds
  });
}

/**
 * Hook for fetching weekly value report
 */
export function useValueWeekly() {
  return useQuery({
    queryKey: ['value-weekly'],
    queryFn: getValueWeekly,
    refetchInterval: 300000, // Every 5 minutes
  });
}
