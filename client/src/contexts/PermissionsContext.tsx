import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type PermissionsContextValue = {
  acciones: Set<string>;
  hasAction: (code: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [acciones, setAcciones] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userData');
      if (raw) {
        const parsed = JSON.parse(raw);
        const list: string[] = Array.isArray(parsed?.acciones) ? parsed.acciones : [];
        setAcciones(new Set(list));
      }
    } catch (e) {
      // noop
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'userData') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          const list: string[] = Array.isArray(parsed?.acciones) ? parsed.acciones : [];
          setAcciones(new Set(list));
        } catch {
          setAcciones(new Set());
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<PermissionsContextValue>(() => ({
    acciones,
    hasAction: (code: string) => acciones.has(code),
  }), [acciones]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions debe usarse dentro de PermissionsProvider');
  return ctx;
}

export const Can: React.FC<{ action: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ action, children, ...rest }) => {
  const { hasAction } = usePermissions();
  if (!hasAction(action)) return null;
  return <div {...rest}>{children}</div>;
};


