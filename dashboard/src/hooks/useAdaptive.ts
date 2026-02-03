import { useQuery } from '@tanstack/react-query';
import {
  getAdaptivePatterns,
  getAdaptiveRecommendations,
  getAdaptiveSummaries,
  getAdaptivePeakHours,
} from '../api/client';

/**
 * Hook for fetching learned usage patterns
 */
export function useAdaptivePatterns() {
  return useQuery({
    queryKey: ['adaptive-patterns'],
    queryFn: getAdaptivePatterns,
    refetchInterval: 300000, // Every 5 minutes
  });
}

/**
 * Hook for fetching adaptive recommendations
 */
export function useAdaptiveRecommendations() {
  return useQuery({
    queryKey: ['adaptive-recommendations'],
    queryFn: getAdaptiveRecommendations,
    refetchInterval: 300000,
  });
}

/**
 * Hook for fetching weekly summaries
 */
export function useAdaptiveSummaries() {
  return useQuery({
    queryKey: ['adaptive-summaries'],
    queryFn: getAdaptiveSummaries,
    refetchInterval: 600000, // Every 10 minutes
  });
}

/**
 * Hook for fetching peak activity hours
 */
export function usePeakHours() {
  return useQuery({
    queryKey: ['adaptive-peak-hours'],
    queryFn: getAdaptivePeakHours,
    refetchInterval: 600000,
  });
}
