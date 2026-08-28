import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {
  RouterProvider,
} from "react-router-dom";
import { router } from './Routes/Router.jsx';
import AuthProvider from './Components/Provider/AuthProvider.jsx';
import { ClientAuthProvider } from './Components/Provider/ClientAuthContext.jsx'; 
import { HelmetProvider } from 'react-helmet-async';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <ClientAuthProvider>
          <QueryClientProvider client={queryClient}>
            <div>
              <RouterProvider router={router} />
            </div>
          </QueryClientProvider>
        </ClientAuthProvider>
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>,
)