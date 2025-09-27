import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <div>Cargando...</div>,
  requireAuth = true 
}) => {
  // Verificar si AuthProvider está disponible
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // Si AuthProvider no está disponible, verificar localStorage directamente
    const token = localStorage.getItem('authToken');
    if (requireAuth && !token) {
      window.location.href = '/login';
      return null;
    }
    return <>{children}</>;
  }

  const { user, isAuthenticated, isLoading } = authContext;
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si hay token en localStorage
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // Con Supabase, verificamos directamente desde localStorage
          // No necesitamos hacer llamada al servidor
          const userData = localStorage.getItem('userData');
          if (!userData) {
            // No hay datos de usuario, limpiar localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar loading mientras se verifica
  if (isLoading || isChecking) {
    return <>{fallback}</>;
  }

  // Si no requiere autenticación, mostrar contenido
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Si requiere autenticación pero no está autenticado
  if (!isAuthenticated) {
    // Redirigir al login
    window.location.href = '/login';
    return null;
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>;
};

// Componente para rutas públicas (solo usuarios no autenticados)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Verificar si hay token en localStorage sin usar useAuth
  const token = localStorage.getItem('authToken');
  
  if (token) {
    // Si hay token, redirigir al dashboard
    window.location.href = '/dashboard';
    return null;
  }

  return <>{children}</>;
}; 