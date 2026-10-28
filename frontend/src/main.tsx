import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry twice with exponential back-off (1 s → 2 s) before showing an error.
      // Helps survive brief network hiccups or a slow backend restart.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      // Re-fetch when the user returns to the browser tab.
      // This is the main fix: if the backend restarted while you were away,
      // the queries heal automatically instead of staying stuck in error state.
      refetchOnWindowFocus: true,
      // Keep data "fresh" for 30 seconds; after that it will silently re-fetch
      // in the background when the component is visible.
      staleTime: 1000 * 30,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
