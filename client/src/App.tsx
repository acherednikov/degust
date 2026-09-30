import { LoginForm } from '@/features/auth/ui/AuthForm';
import { RoomView } from '@/features/room/ui/RoomView';
import { Button } from '@/components/ui/button';

import { useAuthStore } from '@/stores/auth.store';
import { useSignalingStore } from '@/stores/signaling.store';
import { useEffect } from 'react';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (token && !useSignalingStore.getState().socket) {
      useSignalingStore.getState().connect(token);
    }
  }, [token]);

  if (!user) return <LoginForm />;

  return (
    <div className="p-6 font-sans max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Voice Chat</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user.displayName} ({user.userId})
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>
      <RoomView />
    </div>
  );
}
