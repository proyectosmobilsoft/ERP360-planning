import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink, matchPath } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createPortal } from 'react-dom';
import {
  Activity,
  Users,
  User,
  ChevronDown,
  ChevronRight,
  LogOut,
  Mail,
  Shield,
  Key,
  Lock,
  BarChart3,
  Package,
  ShoppingCart,
  Truck,
  Layers,
} from 'lucide-react';

const menuItems = [
  {
    title: "Dashboard",
    icon: <Activity className="h-5 w-5" />,
    path: "/dashboard",
    subItems: [],
  },
  {
    title: "Análisis de la compra",
    icon: <BarChart3 className="h-5 w-5" />,
    path: "/principal/analisis-compra",
    subItems: [],
  },
  {
    title: "Explosión materiales",
    icon: <Layers className="h-5 w-5" />,
    path: "/principal/explosion-material",
    subItems: [],
  },
  {
    title: "Planeación Compra",
    icon: <ShoppingCart className="h-5 w-5" />,
    path: "/principal/planeacion-compra",
    subItems: [],
  },
  {
    title: "Distribución Unidades",
    icon: <Truck className="h-5 w-5" />,
    path: "/general/distribucion-unidades",
    subItems: [],
  },
];

interface DynamicSidebarProps {
  onNavigate?: (path: string) => void;
}

export function DynamicSidebar({ onNavigate }: DynamicSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [showUserOverlay, setShowUserOverlay] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Cargar userData de localStorage
  useEffect(() => {
    const currentUserData = localStorage.getItem('userData');
    if (currentUserData) {
      try {
        const parsed = JSON.parse(currentUserData);
        setUserData(parsed);
      } catch { }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'userData') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setUserData(parsed);
        } catch { }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Detectar automáticamente qué menú debe estar desplegado basado en la ruta actual
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded = new Set<string>();

    // Buscar qué menú contiene la ruta actual
    menuItems.forEach((menu, index) => {
      if (menu.subItems && menu.subItems.length > 0) {
        // Verificar si algún subitem coincide con la ruta actual
        const hasActiveSubItem = menu.subItems.some(subItem =>
          matchPath({ path: subItem.path, end: true }, currentPath)
        );

        if (hasActiveSubItem) {
          newExpanded.add(index.toString());
        }
      }
    });

    setExpandedMenus(newExpanded);
  }, [location.pathname]);

  const toggleMenu = (index: number) => {
    const newExpanded = new Set<string>();
    const menuKey = index.toString();
    // Si el menú ya está expandido, lo contraemos
    if (expandedMenus.has(menuKey)) {
      // No agregamos nada al Set, queda vacío
    } else {
      // Si no está expandido, lo expandimos (y automáticamente contraemos otros)
      newExpanded.add(menuKey);
    }
    setExpandedMenus(newExpanded);
  };

  const handleNavigate = (path: string) => {
    if (path && path !== '#') {
      // Solo cerrar overlays, no colapsar menús
      setShowUserOverlay(false);
      // Contraer sidebar al navegar
      setIsCollapsed(true);
      navigate(path);
      if (onNavigate) onNavigate(path);
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    // Por defecto, exact match
    return !!matchPath({ path, end: true }, location.pathname);
  };

  // Determinar si el sidebar debe estar expandido (hover o no colapsado)
  const isExpanded = !isCollapsed || isHovered;

  // Efecto para detectar hover en el área del borde izquierdo cuando está colapsado
  useEffect(() => {
    if (!isCollapsed) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Limpiar timeout anterior si existe
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }

      // Si el mouse está en los primeros 32px del borde izquierdo, expandir inmediatamente
      if (e.clientX <= 32) {
        setIsHovered(true);
      }
      // Si el mouse está dentro del área del sidebar (0-256px), mantener visible
      else if (e.clientX >= 0 && e.clientX <= 256 && isHovered) {
        setIsHovered(true);
      }
      // Si el mouse está fuera del área completa del sidebar, programar ocultación
      else if (e.clientX > 256) {
        const timeout = setTimeout(() => {
          setIsHovered(false);
        }, 200); // Delay un poco más largo para evitar cierres accidentales
        setHoverTimeout(timeout);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [isCollapsed, isHovered, hoverTimeout]);

  return (
    <div 
      className={`sidebar-container ${isExpanded ? 'expanded' : 'collapsed'}`}
      ref={sidebarRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        // Limpiar timeout si existe
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          setHoverTimeout(null);
        }
        // Programar ocultación con delay
        const timeout = setTimeout(() => {
          setIsHovered(false);
        }, 300);
        setHoverTimeout(timeout);
      }}
    >
      {/* Indicador visual cuando está completamente colapsado (no expandido por hover) */}
      {isCollapsed && !isHovered && (
        <div className="sidebar-indicator">☰</div>
      )}
      {/* Header con información del usuario */}
      <div className="sidebar-header">
        <div className="flex justify-between space-x-3">
          <button
            onClick={() => setShowUserOverlay(!showUserOverlay)}
            className="user-avatar-large bg-blue-600 hover:bg-blue-700 transition-colors duration-200 cursor-pointer overflow-hidden flex-shrink-0"
          >
            {userData?.foto_base64 ? (
              <img src={userData.foto_base64} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="text-white" />
            )}
          </button>
          {/* Información adicional del usuario */}
          <div className="mt-3 space-y-2">
            {/* Estado de conexión */}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${userData?.activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600 font-medium">
                  {userData?.activo ? 'En línea' : 'Desconectado'}
                </span>
              </div>
            </div>

            {/* Última actividad */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 group relative">
                <span className="text-xs text-gray-600">
                  {userData?.ultimoAcceso
                    ? new Date(userData.ultimoAcceso).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : 'No disponible'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Información del usuario */}
        <div className="flex items-start space-x-3">
          {/* Información del usuario: nombre y detalles adicionales */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userData ? `${userData.primerNombre} ${userData.primerApellido}` : 'Usuario'}
            </p>

            {/* Información adicional del usuario */}
            <div className="user-info-section">
              {/* Email */}
              <div className="user-info-item">
                <Mail className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">{userData?.email || ''}</p>
              </div>

              {/* Rol/Perfil */}
              {userData?.roles && userData.roles.length > 0 && (
                <div className="user-info-item">
                  <Shield className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {userData.roles[0]?.nombre || userData?.role || 'Rol'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Línea divisoria */}

        {/* Overlay del usuario */}
        {showUserOverlay && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-start justify-start">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-25"
              onClick={() => setShowUserOverlay(false)}
            ></div>

            {/* Modal */}
            <div className="relative mt-16 ml-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[400px] max-w-[500px] max-h-[80vh] overflow-y-auto">
              <div className="space-y-4">
                {/* Header del overlay */}
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                  <div className="user-avatar-large bg-blue-600 overflow-hidden">
                    {userData?.foto_base64 ? (
                      <img src={userData.foto_base64} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {userData ? `${userData.primerNombre} ${userData.primerApellido}` : 'Usuario'}
                    </h3>
                    <p className="text-sm text-gray-500">{userData?.email}</p>
                    <p className="text-xs text-blue-600 font-medium">{userData?.role}</p>
                  </div>
                  <button
                    onClick={() => setShowUserOverlay(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Información detallada */}
                <div className="space-y-4">
                  {/* Perfiles */}
                  {userData?.roles && userData.roles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Perfiles asignados:</h4>
                      <div className="flex flex-wrap gap-2">
                        {userData.roles.map((role: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                            {role.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Usuario ID:</p>
                        <p className="font-medium">{userData?.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Estado:</p>
                        <p className="font-medium">{userData?.activo ? 'Activo' : 'Inactivo'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de cerrar sesión */}
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowUserOverlay(false);
                      // Limpiar todo el localStorage
                      localStorage.removeItem('userData');
                      localStorage.removeItem('token');
                      localStorage.removeItem('authToken');
                      localStorage.removeItem('empresaData');

                      console.log('Sesión cerrada desde overlay - todos los datos eliminados');

                      // Redirigir al login
                      window.location.href = '/login';
                    }}
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-sm py-2"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Sistema de navegación */}
      <div className="sidebar-scroll">
        <nav className="space-y-1">
          {menuItems.map((menu, index) => {
            const hasChildren = menu.subItems && menu.subItems.length > 0;
            const isExpanded = expandedMenus.has(index.toString());
            const isMenuActive = isActive((menu as any).path);

            return (
              <div key={index} className="mb-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium menu-item-animation sidebar-menu-item ${isMenuActive ? 'menu-item-active' : ''
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      {menu.icon}
                      <span>{menu.title}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 menu-arrow ${isExpanded ? 'expanded' : 'collapsed'}`} />
                  </button>
                ) : (
                  <NavLink
                    to={(menu as any).path || '#'}
                    onClick={() => handleNavigate((menu as any).path || '#')}
                    className={({ isActive: active }) => `w-full block text-left px-3 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium menu-item-animation sidebar-menu-item ${active ? 'menu-item-active' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      {menu.icon}
                      <span>{menu.title}</span>
                    </div>
                  </NavLink>
                )}

                {/* Submenús */}
                {hasChildren && (
                  <div className={`submenu-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                      {menu.subItems?.map((subItem: any, subIndex: number) => {
                        const isSubItemActive = isActive(subItem.path);
                        return (
                          <NavLink
                            key={subIndex}
                            to={subItem.path || '#'}
                            onClick={() => handleNavigate(subItem.path || '#')}
                            className={({ isActive: active }) => `submenu-item w-full block text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 menu-item-animation sidebar-menu-item ${active ? 'menu-item-active' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                          >
                            <div className="flex items-center space-x-3">
                              {subItem.icon}
                              <span>{subItem.title}</span>
                            </div>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer del sidebar */}
      <div className="sidebar-footer">
        {/* El botón de logout ahora está en el overlay del usuario */}
      </div>
    </div>
  );
}