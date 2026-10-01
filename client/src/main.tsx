import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen.ts';

import './app/styles/index.css';

const router = createRouter({
  // basepath: '/',
  routeTree,
  history: createHashHistory(),
  defaultNotFoundComponent: () => (
    <div style={{ padding: 24 }}>
      <h1>404 — Страница не найдена</h1>
      <p>Такой страницы не существует.</p>
    </div>
  ),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
