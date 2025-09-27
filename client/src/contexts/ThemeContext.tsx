import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  primaryHsl: string;
  secondaryHsl: string;
  accentHsl: string;
}

export const themes: ColorTheme[] = [
  {
    id: 'verde-azul-gris',
    name: 'Verde → Azul → Gris',
    primary: '#c1d009',    // Lima/Verde
    secondary: '#1fb5ca',  // Turquesa/Azul
    accent: '#9d9d9d',     // Gris
    primaryHsl: '69, 89%, 43%',
    secondaryHsl: '187, 72%, 45%',
    accentHsl: '0, 0%, 62%'
  },
  {
    id: 'gris-verde-azul',
    name: 'Gris → Verde → Azul',
    primary: '#9d9d9d',    // Gris
    secondary: '#c1d009',  // Verde
    accent: '#1fb5ca',     // Azul
    primaryHsl: '0, 0%, 62%',
    secondaryHsl: '69, 89%, 43%',
    accentHsl: '187, 72%, 45%'
  },
  {
    id: 'azul-gris-verde',
    name: 'Azul → Gris → Verde',
    primary: '#1fb5ca',    // Azul
    secondary: '#9d9d9d',  // Gris
    accent: '#c1d009',     // Verde
    primaryHsl: '187, 72%, 45%',
    secondaryHsl: '0, 0%, 62%',
    accentHsl: '69, 89%, 43%'
  }
];

interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (themeId: string) => void;
  themes: ColorTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(themes[0]);

  useEffect(() => {
    // Cargar tema desde localStorage al inicializar
    const savedThemeId = localStorage.getItem('zeus-theme');
    if (savedThemeId) {
      const savedTheme = themes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    // Aplicar variables CSS cuando cambie el tema
    const root = document.documentElement;
    
    // Aplicar colores principales
    root.style.setProperty('--brand-primary', currentTheme.primary);
    root.style.setProperty('--brand-secondary', currentTheme.secondary);
    root.style.setProperty('--brand-accent', currentTheme.accent);
    
    // Aplicar valores HSL para Tailwind
    root.style.setProperty('--brand-lime', currentTheme.primaryHsl);
    root.style.setProperty('--brand-turquoise', currentTheme.secondaryHsl);
    root.style.setProperty('--brand-gray', currentTheme.accentHsl);
    
    // Agregar clase de transición suave
    root.classList.add('theme-transition');
    
    // Remover clase de transición después de la animación
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
    
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('zeus-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};