import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Key, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';


export default function VerificarCodigoPage() {
  const [codigo, setCodigo] = useState('');
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [confirmarContraseña, setConfirmarContraseña] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codigoVerificado, setCodigoVerificado] = useState(false);
  const [email, setEmail] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // Si no hay email, redirigir a recuperar contraseña
      navigate('/recuperar-password');
    }
  }, [location.state, navigate]);

  const handleVerificarCodigo = async () => {
    if (!codigo.trim()) {
      toast.error('Por favor ingresa el código de verificación');
      return;
    }

    if (codigo.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const resultado = await authService.verificarCodigo(email, codigo);

      if (resultado.success) {
        setCodigoVerificado(true);
        toast.success('Código verificado correctamente');
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      console.error('Error verificando código:', error);
      toast.error('Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarContraseña = async () => {
    if (!nuevaContraseña.trim()) {
      toast.error('Por favor ingresa la nueva contraseña');
      return;
    }

    if (nuevaContraseña.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaContraseña !== confirmarContraseña) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const resultado = await authService.cambiarContraseña(email, codigo, nuevaContraseña);

      if (resultado.success) {
        toast.success('Contraseña cambiada exitosamente');
        navigate('/login');
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return null; // No mostrar nada mientras se redirige
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-lime/10 to-brand-turquoise/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="logo-login">
            <img
              src="https://mobilsoft.co/assets/img/logooo.png"
              alt="Mobilsoft Logo"
              className="w-56 h-40 mx-auto object-contain"
            />
          </div>
        </div>

        {/* Verification Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Key className="h-12 w-12 text-brand-lime" />
            </div>
            <CardTitle className="text-2xl text-center">
              {codigoVerificado ? 'Nueva Contraseña' : 'Verificar Código'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 text-center">
              {codigoVerificado
                ? 'Ingresa tu nueva contraseña'
                : `Ingresa el código enviado a ${email}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!codigoVerificado ? (
              // Formulario para verificar código
              <>
                <div className="space-y-2">
                  <Label htmlFor="codigo" className="text-sm font-medium">
                    Código de Verificación
                  </Label>
                  <Input
                    id="codigo"
                    type="text"
                    placeholder="123456"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerificarCodigo()}
                    disabled={isLoading}
                    className="h-12 text-center text-lg tracking-widest login-input"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleVerificarCodigo}
                  disabled={isLoading || codigo.length !== 6}
                  className="w-full h-12 login-button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Verificar Código
                    </>
                  )}
                </Button>
              </>
            ) : (
              // Formulario para nueva contraseña
              <>
                <div className="space-y-2">
                  <Label htmlFor="nuevaContraseña" className="text-sm font-medium">
                    Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="nuevaContraseña"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu nueva contraseña"
                      value={nuevaContraseña}
                      onChange={(e) => setNuevaContraseña(e.target.value)}
                      disabled={isLoading}
                      className="h-12 pr-10 login-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarContraseña" className="text-sm font-medium">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmarContraseña"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirma tu nueva contraseña"
                      value={confirmarContraseña}
                      onChange={(e) => setConfirmarContraseña(e.target.value)}
                      disabled={isLoading}
                      className="h-12 pr-10 login-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleCambiarContraseña}
                  disabled={isLoading || !nuevaContraseña || !confirmarContraseña || nuevaContraseña !== confirmarContraseña}
                  className="w-full h-12 login-button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cambiando contraseña...
                    </>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </Button>
              </>
            )}

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/recuperar-password')}
                className="text-sm forgot-password-link hover:underline transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 