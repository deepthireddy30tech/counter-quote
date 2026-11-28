import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router-dom';
import { JobEditorPage } from './pages/JobEditorPage';
import { JobsPage } from './pages/JobsPage';
import { PriceListPage } from './pages/PriceListPage';
import './index.css';

function Layout() {
  return (
    <>
      <header className="app-header">
        <Link to="/" className="app-title">Counter Quote</Link>
        <nav className="app-nav">
          <Link to="/price-list">Price list</Link>
          <Link to="/jobs/new" className="button">New job</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

// a data router, so pages with unsaved changes can warn before leaving (useBlocker)
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <JobsPage /> },
      { path: '/jobs/new', element: <JobEditorPage /> },
      { path: '/jobs/:id', element: <JobEditorPage /> },
      { path: '/price-list', element: <PriceListPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
