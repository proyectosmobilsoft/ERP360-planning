
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DynamicSidebar } from './DynamicSidebar';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, Users, Key, Lock, Activity, Building, Package, BookOpen, Calculator, TrendingUp, FileText, UserCheck } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar sidebar en dispositivos móviles al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (path: string) => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">


      {/* Contenido principal */}
      <div className="layout-main">
        {/* Sidebar */}
        <aside className={`layout-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <DynamicSidebar onNavigate={handleNavigate} />
        </aside>

        {/* Contenido principal */}
        <main className="layout-content">
          {/* Botón de toggle para móviles */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSidebar}
              className="mb-4"
            >
              {sidebarOpen ? <X className="h-4 w-4 mr-2" /> : <Menu className="h-4 w-4 mr-2" />}
              {sidebarOpen ? 'Cerrar Menú' : 'Abrir Menú'}
            </Button>
          </div>

          {/* Header del módulo */}
          <div className="module-header">
            <h1 className="module-title font-extrabold text-cyan-800">
              <span className="module-icon"><Package /></span>
              Módulo de Planeación 
            </h1>
          </div>

          <Outlet />
        </main>
      </div>

      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
