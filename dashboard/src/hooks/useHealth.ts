import { useQuery } from '@tanstack/react-query';
import { getHealth, getDetailedHealth } from '../api/client';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useDetailedHealth() {
  return useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: getDetailedHealth,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
