import { createRootRoute, Outlet } from '@tanstack/react-router';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';

import { LoginForm } from '@/features/auth/ui/AuthForm';
import { Button } from '@/components/shared/button';
import { useSignalingStore } from '@/stores/signaling.store';
import { useAuth } from '@/features/auth/model/useAuth';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <p>Not Found</p>,
});

function RootLayout() {
  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (token && !useSignalingStore.getState().socket) {
      useSignalingStore.getState().connect(token);
    }
  }, [token]);

  // Не залогинен → показываем форму логина, без Outlet
  if (!user) return <LoginForm />;

  return (
    <div className="p-6 font-sans max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Voice Chat</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user.displayName}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>

      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </div>
  );
}