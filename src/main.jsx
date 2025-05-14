import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {
  RouterProvider,
} from "react-router-dom";
import { router } from './Routes/Router.jsx';
import AuthProvider from './Components/Provider/AuthProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <div>
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  </StrictMode>,
)
