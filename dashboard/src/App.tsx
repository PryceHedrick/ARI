import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { Governance } from './pages/Governance';
import { Memory } from './pages/Memory';
import { Tools } from './pages/Tools';
import { Agents } from './pages/Agents';
import { Audit } from './pages/Audit';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'governance':
        return <Governance />;
      case 'memory':
        return <Memory />;
      case 'tools':
        return <Tools />;
      case 'agents':
        return <Agents />;
      case 'audit':
        return <Audit />;
      default:
        return <Home />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        <ErrorBoundary>
          {renderPage()}
        </ErrorBoundary>
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
