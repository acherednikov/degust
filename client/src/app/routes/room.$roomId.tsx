import { createFileRoute, redirect } from '@tanstack/react-router';

import { Room } from '@/features/room/ui/Room';

export const Route = createFileRoute('/room/$roomId')({
  component: Room,
  notFoundComponent: () => <p>Комната не найдена</p>,
});
