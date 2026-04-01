import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupHttpInterceptors } from './config/axiosInterceptors'

// Configurar interceptores globales de axios + fetch para manejar permisos/autenticacion
setupHttpInterceptors();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
