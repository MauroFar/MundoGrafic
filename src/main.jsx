import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupHttpInterceptors } from './config/axiosInterceptors'
import { startBuildUpdateChecker } from './lib/buildUpdateChecker'

// Configurar interceptores globales de axios + fetch para manejar permisos/autenticacion
setupHttpInterceptors();

// En produccion, recarga automaticamente cuando detecta un nuevo build desplegado.
startBuildUpdateChecker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
