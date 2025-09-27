
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Páginas de autenticación
import LoginUnificado from './pages/LoginUnificado';
import RecuperarPasswordPage from './pages/auth/RecuperarPasswordPage';
import VerificarCodigoPage from './pages/auth/VerificarCodigoPage';
// Páginas protegidas
import Index from './pages/Index';

// Páginas de seguridad
import UsuariosPage from './pages/seguridad/UsuariosPage';
import CrearUsuarioPage from './pages/seguridad/CrearUsuarioPage';
import EditarUsuarioPage from './pages/seguridad/EditarUsuarioPage';
import PerfilesPage from './pages/seguridad/PerfilesPage';

import GestionPermisosPage from './pages/seguridad/GestionPermisosPage';
import PermisosPage from './pages/seguridad/PermisosPage';
import MenuPage from './pages/seguridad/MenuPage';

import NotFound from './pages/NotFound';

import './App.css';
import { PublicRoute } from './components/AuthGuard';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Toasters globales para notificaciones */}
        <Sonner position="top-right" richColors />
        <Toaster />
        
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginUnificado />} />
          <Route path="/recuperar-password" element={
              <PublicRoute>
                <RecuperarPasswordPage />
              </PublicRoute>
            } />
            <Route path="/verificar-codigo" element={
              <PublicRoute>
                <VerificarCodigoPage />
              </PublicRoute>
            } />
          {/* Layout con menú para rutas protegidas */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            
            {/* Rutas de seguridad */}
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/seguridad/usuarios" element={<UsuariosPage />} />
            <Route path="/seguridad/usuarios/crear" element={<CrearUsuarioPage />} />
            <Route path="/seguridad/usuarios/editar/:id" element={<EditarUsuarioPage />} />
            
            <Route path="/seguridad/perfiles" element={<PerfilesPage />} />
            <Route path="/seguridad/permisos" element={<PermisosPage />} />
            <Route path="/seguridad/gestion-permisos" element={<GestionPermisosPage />} />
            <Route path="/seguridad/menu" element={<MenuPage />} />

          </Route>
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
