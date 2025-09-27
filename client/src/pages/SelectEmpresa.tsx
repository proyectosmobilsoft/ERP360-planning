import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, User, CheckCircle } from 'lucide-react';
import logo from '/logo2.svg';

export default function SelectEmpresa() {
  const { user, selectEmpresa } = useAuth();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Si el usuario no tiene múltiples empresas, redirigir
    if (!user || !user.empresas || user.empresas.length <= 1) {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const handleEmpresaSelect = async () => {
    if (!selectedEmpresa) {
      alert('Por favor selecciona una empresa');
      return;
    }

    setIsLoading(true);
    try {
      await selectEmpresa(selectedEmpresa);
    } catch (error) {
      console.error('Error seleccionando empresa:', error);
      alert('Error al seleccionar la empresa');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !user.empresas || user.empresas.length <= 1) {
    return <div>Cargando...</div>;
  }

  return (
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Logo" className="h-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Selecciona tu Empresa
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Hola {user.primerNombre} {user.primerApellido}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {user.empresas.map((empresa) => (
              <div
                key={empresa.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedEmpresa === empresa.id.toString()
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedEmpresa(empresa.id.toString())}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-cyan-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {empresa.razon_social}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {empresa.id}
                      </p>
                    </div>
                  </div>
                  {selectedEmpresa === empresa.id.toString() && (
                    <CheckCircle className="w-5 h-5 text-cyan-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleEmpresaSelect}
            disabled={!selectedEmpresa || isLoading}
            className="w-full"
          >
            {isLoading ? 'Seleccionando...' : 'Continuar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 