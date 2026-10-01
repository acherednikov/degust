import { createFileRoute, redirect } from '@tanstack/react-router';

import { useAuthStore } from '@/stores/auth.store';
import { Room } from '@/features/room/ui/Room';

export const Route = createFileRoute('/room/$roomId')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (!user) {
      throw redirect({ to: '/' });
    }
  },
  component: Room,
  notFoundComponent: () => <p>Комната не найдена</p>,
});
