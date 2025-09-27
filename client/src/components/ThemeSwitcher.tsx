import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Palette, CheckCircle, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative overflow-hidden group hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg border-brand-lime/30 text-brand-lime hover:bg-brand-lime/10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-lime/20 to-brand-turquoise/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Palette className="w-4 h-4 mr-2 relative z-10" />
          <span className="relative z-10">Cambiar Tema</span>
          <Sparkles className="w-3 h-3 ml-2 relative z-10 animate-pulse" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-brand-lime to-brand-turquoise bg-clip-text text-transparent">
            Intercambio de Colores
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Cambia la disposición de los colores Verde, Azul y Gris en toda la interfaz
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-auto" style={{ paddingLeft: '30px', paddingRight: '30px' }}>
          {themes.map((theme) => (
            <Card
              key={theme.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${currentTheme.id === theme.id
                ? 'border-brand-lime shadow-lg ring-2 ring-brand-lime/30'
                : 'border-gray-200 hover:border-brand-turquoise/50'
                }`}
              onClick={() => handleThemeChange(theme.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{theme.name}</CardTitle>
                  {currentTheme.id === theme.id && (
                    <CheckCircle className="w-5 h-5 text-brand-lime animate-pulse" />
                  )}
                </div>

                {/* Vista previa de colores */}
                <div className="flex gap-2 mt-3">
                  <div
                    className="w-8 h-8 rounded-full shadow-md border-2 border-white"
                    style={{ backgroundColor: theme.primary }}
                    title="Color Primario"
                  />
                  <div
                    className="w-8 h-8 rounded-full shadow-md border-2 border-white"
                    style={{ backgroundColor: theme.secondary }}
                    title="Color Secundario"
                  />
                  <div
                    className="w-8 h-8 rounded-full shadow-md border-2 border-white"
                    style={{ backgroundColor: theme.accent }}
                    title="Color de Acento"
                  />
                </div>
              </CardHeader>

              <CardContent>
                {/* Simulación de interfaz mejorada */}
                <div className="space-y-3">
                  <div
                    className="h-8 rounded text-white text-xs flex items-center justify-center font-medium shadow-sm"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Botón Principal
                  </div>
                  <div
                    className="h-6 rounded text-white text-xs flex items-center justify-center font-medium"
                    style={{ backgroundColor: theme.secondary }}
                  >
                    Botón Secundario
                  </div>
                  <div
                    className="h-6 rounded text-white text-xs flex items-center justify-center font-medium"
                    style={{ backgroundColor: theme.accent }}
                  >
                    Botón Terciario
                  </div>

                  <div className="text-xs text-gray-600 text-center">
                    {theme.id === 'verde-azul-gris' && 'Verde → Azul → Gris'}
                    {theme.id === 'gris-verde-azul' && 'Gris → Verde → Azul'}
                    {theme.id === 'azul-gris-verde' && 'Azul → Gris → Verde'}
                  </div>
                </div>

                {currentTheme.id === theme.id && (
                  <Badge
                    variant="secondary"
                    className="w-full mt-3 justify-center bg-brand-lime/10 text-brand-lime border-brand-lime/30"
                  >
                    Tema Activo
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Configuración actual: <span className="font-medium text-brand-lime">{currentTheme.name}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-brand-turquoise text-brand-turquoise hover:bg-brand-turquoise/10"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};