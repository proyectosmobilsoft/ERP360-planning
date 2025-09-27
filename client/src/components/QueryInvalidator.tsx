import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export function QueryInvalidator() {
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidar queries específicas cuando cambias de ruta
    const queriesToInvalidate = [
      'departamentos_ciudades',
      'empresas',
      'candidatos',
      'prestadores',
      'usuarios',
      'perfiles',
      'analistas',
      'tipos-candidatos',
      'plantillas'
    ];

    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  }, [location.pathname, queryClient]);

  return null;
} 