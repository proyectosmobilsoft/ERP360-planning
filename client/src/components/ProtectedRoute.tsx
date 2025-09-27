import React from 'react';
import { AuthGuard } from './AuthGuard';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
    return (
    <AuthGuard fallback={fallback}>
      {children}
    </AuthGuard>
  );
};

// Componente para rutas que requieren permisos específicos
interface PermissionRouteProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ 
  children, 
  permission,
  fallback 
}) => {
  return (
    <AuthGuard fallback={fallback}>
      <PermissionGuard permission={permission}>
        {children}
      </PermissionGuard>
    </AuthGuard>
    );
};

// Componente para verificar permisos específicos
interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  permission,
  fallback = <div>No tienes permisos para acceder a esta página</div>
}) => {
  // Verificar si AuthProvider está disponible
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // Si AuthProvider no está disponible, permitir acceso
  return <>{children}</>;
  }

  const { hasPermission } = authContext;

  if (!hasPermission(permission as any)) {
      return <>{fallback}</>;
  }

  return <>{children}</>;
};