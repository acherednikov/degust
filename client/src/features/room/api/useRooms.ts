import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchRooms } from './client';

export const roomsKeys = {
  all: ['rooms'] as const,
};

export function useRooms() {
  return useQuery({
    queryKey: roomsKeys.all,
    queryFn: fetchRooms,
  });
}

export function useInvalidateRooms() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: roomsKeys.all });
}
