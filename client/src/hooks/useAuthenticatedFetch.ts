import { useCallback } from 'react';

interface AuthenticatedFetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export const useAuthenticatedFetch = () => {
  const authenticatedFetch = useCallback(async (
    url: string, 
    options: AuthenticatedFetchOptions = {}
  ) => {
    const { requireAuth = true, ...fetchOptions } = options;
    
    // Obtener token del localStorage
    const token = localStorage.getItem('authToken');
    
    // Preparar headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers
    };

    // Agregar token de autorización si está disponible
    if (token && requireAuth) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers
      });

      // Si el token es inválido, limpiar localStorage y redirigir
      if (response.status === 401 && requireAuth) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        throw new Error('Token inválido');
      }

      return response;
    } catch (error) {
      console.error('Error en petición autenticada:', error);
      throw error;
    }
  }, []);

  return authenticatedFetch;
}; 