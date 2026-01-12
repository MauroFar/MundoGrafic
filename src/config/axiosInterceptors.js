import axios from 'axios';
import { toast } from 'react-toastify';

// Configurar interceptor de respuestas para manejar errores 403
export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403) {
        // Error 403 - Sin permisos
        toast.error(
          '🔒 No tienes permisos para modificar datos. Contacta al administrador del sistema.',
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else if (error.response?.status === 401) {
        // Error 401 - No autenticado
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );
};
