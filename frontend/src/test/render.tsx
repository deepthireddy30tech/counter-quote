import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router-dom';
import { JobEditorPage } from '../pages/JobEditorPage';
import { JobsPage } from '../pages/JobsPage';
import { PriceListPage } from '../pages/PriceListPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** The app's routes, opened at `path`, with a link out so leaving can be tested. Retries are off so API errors show at once. */
export function renderAt(path: string) {
  const router = createMemoryRouter([
    {
      element: <><Link to="/">Jobs</Link><Outlet /></>,
      children: [
        { path: '/', element: <JobsPage /> },
        { path: '/jobs/new', element: <JobEditorPage /> },
        { path: '/jobs/:id', element: <JobEditorPage /> },
        { path: '/price-list', element: <PriceListPage /> },
      ],
    },
  ], { initialEntries: [path] });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
  return router;
}
