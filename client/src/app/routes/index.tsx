import { createFileRoute } from '@tanstack/react-router';

import { Lobby } from '@/features/room/ui/Lobby';

export const Route = createFileRoute('/')({
  component: Lobby,
});
