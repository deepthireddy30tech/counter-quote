import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { JobPage } from './pages/JobPage';
import { JobsPage } from './pages/JobsPage';
import { NewJobPage } from './pages/NewJobPage';
import { PriceListPage } from './pages/PriceListPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <header className="app-header">
          <Link to="/" className="app-title">Counter Quote</Link>
          <nav className="app-nav">
            <Link to="/price-list">Price list</Link>
            <Link to="/jobs/new" className="button">New job</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<JobsPage />} />
            <Route path="/jobs/new" element={<NewJobPage />} />
            <Route path="/jobs/:id" element={<JobPage />} />
            <Route path="/price-list" element={<PriceListPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
