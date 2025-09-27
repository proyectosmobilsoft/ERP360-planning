import { useEffect, useMemo } from 'react';
import { registerAction, registerView } from '@/lib/actionsRegistry';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function useRegisterView(moduleName: string, tipo: 'listado' | 'formulario', title?: string) {
  const viewCode = useMemo(() => `vista-${tipo}-${slugify(moduleName)}`, [moduleName, tipo]);

  useEffect(() => {
    registerView(viewCode, title ?? `${tipo} ${moduleName}`);
  }, [viewCode, title, moduleName]);

  const addAction = (funcion: string, actionTitle?: string) => {
    const actionCode = `accion-${slugify(funcion)}`;
    registerAction(viewCode, actionTitle ?? funcion, actionCode);
    return actionCode;
  };

  return { viewCode, addAction };
}


