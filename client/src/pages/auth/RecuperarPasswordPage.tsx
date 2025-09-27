import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/authService';


export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const navigate = useNavigate();

  const handleSolicitarCodigo = async () => {
    if (!email.trim()) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    try {
      const resultado = await authService.generarCodigoVerificacion(email);

      if (resultado.success) {
        setCodigoEnviado(true);
        setAdminEmail(resultado.adminEmail || '');
        setShowModal(true);
        toast.success(resultado.message);
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      console.error('Error solicitando código:', error);
      toast.error('Error al enviar el código de verificación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Redirigir a la página de verificación
    navigate('/verificar-codigo', {
      state: { email }
    });
  };

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

        {/* Recovery Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-12 w-12 text-brand-lime" />
            </div>
            <CardTitle className="text-2xl text-center">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-sm text-gray-600 text-center">
              Ingresa tu correo electrónico para validar tu identidad
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSolicitarCodigo()}
                disabled={isLoading}
                className="h-12 login-input"
              />
            </div>

            <Button
              onClick={handleSolicitarCodigo}
              disabled={isLoading || !email.trim()}
              className="w-full h-12 login-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando identidad...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Validar Identidad
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-sm forgot-password-link hover:underline transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Código Enviado al Administrador
              </h3>
              <p className="text-gray-600 mb-4">
                Tu identidad ha sido validada. El código de verificación ha sido enviado al administrador del sistema.
              </p>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-cyan-600" />
                  <span className="text-sm font-medium text-cyan-800">Correo del administrador:</span>
                </div>
                <p className="text-cyan-900 font-mono text-sm mt-1">{adminEmail}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Próximo paso:</p>
                    <p>Contacta al administrador para obtener el código de verificación y continuar con el proceso.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCloseModal}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 