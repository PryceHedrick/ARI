import { useQuery } from '@tanstack/react-query';
import { getSubagents, getSubagentStats } from '../api/client';

/**
 * Hook to fetch all subagents
 * Polls every 5 seconds for real-time updates
 */
export function useSubagents() {
  return useQuery({
    queryKey: ['subagents'],
    queryFn: getSubagents,
    refetchInterval: 5000,
  });
}

/**
 * Hook to fetch subagent statistics
 * Polls every 5 seconds
 */
export function useSubagentStats() {
  return useQuery({
    queryKey: ['subagent-stats'],
    queryFn: getSubagentStats,
    refetchInterval: 5000,
  });
}
