// Configuración de permisos y roles del sistema
export type UserRole = "admin" | "analista" | "cliente" | "candidato";

export type Permission = 
  // Dashboard y home
  | "ver_dashboard"
  | "ver_dashboard_admin"
  | "ver_dashboard_analista" 
  | "ver_dashboard_cliente"
  


  // Seguridad
  | "ver_usuarios"
  | "crear_usuarios"
  | "editar_usuarios"
  | "eliminar_usuarios"
  | "ver_perfiles"
  | "crear_perfiles"
  | "editar_perfiles"
  | "eliminar_perfiles"
  | "gestionar_permisos"
  
  // Maestros
  | "ver_maestros"
  | "crear_maestros"
  | "editar_maestros"
  | "eliminar_maestros"
  | "ver_tipos_candidatos"
  | "ver_tipos_documentos"
  
  // Clientes
  | "ver_clientes"
  | "crear_clientes"
  | "editar_clientes"
  | "eliminar_clientes"
  | "ver_empresas_afiliadas"
  
  // Analistas
  | "ver_analistas"
  | "crear_analistas"
  | "editar_analistas"
  | "eliminar_analistas"
  
  // Órdenes
  | "ver_ordenes"
  | "crear_ordenes"
  | "editar_ordenes"
  | "eliminar_ordenes"
  | "expedicion_orden"
  | "gestionar_templates_ordenes"
  
  // Certificados
  | "ver_certificados"
  | "crear_certificados"
  | "editar_certificados"
  | "eliminar_certificados"
  | "expedicion_certificados"
  
  // Reportes
  | "ver_reportes"
  | "generar_reportes"
  | "exportar_reportes"
  
  // Candidatos
  | "ver_candidatos"
  | "crear_candidatos"
  | "editar_candidatos"
  | "eliminar_candidatos"
  | "ver_informacion_personal"
  | "editar_informacion_personal";

// Configuración de permisos por rol base
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Dashboard
    "ver_dashboard",
    "ver_dashboard_admin",
    
    // Seguridad - acceso completo
    "ver_usuarios",
    "crear_usuarios", 
    "editar_usuarios",
    "eliminar_usuarios",
    "ver_perfiles",
    "crear_perfiles",
    "editar_perfiles",
    "eliminar_perfiles",
    "gestionar_permisos",
    
    // Maestros - acceso completo
    "ver_maestros",
    "crear_maestros",
    "editar_maestros",
    "eliminar_maestros",
    "ver_tipos_candidatos",
    "ver_tipos_documentos",
    
    // Clientes - acceso completo
    "ver_clientes",
    "crear_clientes",
    "editar_clientes",
    "eliminar_clientes",
    "ver_empresas_afiliadas",
    
    // Analistas - acceso completo
    "ver_analistas",
    "crear_analistas",
    "editar_analistas",
    "eliminar_analistas",
    
    // Órdenes - acceso completo
    "ver_ordenes",
    "crear_ordenes",
    "editar_ordenes",
    "eliminar_ordenes",
    "expedicion_orden",
    "gestionar_templates_ordenes",
    
    // Certificados - acceso completo
    "ver_certificados",
    "crear_certificados",
    "editar_certificados",
    "eliminar_certificados",
    "expedicion_certificados",
    
    // Reportes - acceso completo
    "ver_reportes",
    "generar_reportes",
    "exportar_reportes",
    
    // Candidatos - acceso completo
    "ver_candidatos",
    "crear_candidatos",
    "editar_candidatos",
    "eliminar_candidatos",

    // Nueva Plantilla (Galería)
    "ver_galeria_formularios"
  ],
  
  analista: [
    // Dashboard
    "ver_dashboard",
    "ver_dashboard_analista",
    
    // Órdenes - gestión limitada
    "ver_ordenes",
    "crear_ordenes",
    "editar_ordenes",
    "expedicion_orden",
    
    // Certificados - gestión limitada
    "ver_certificados",
    "crear_certificados",
    "editar_certificados",
    "expedicion_certificados",
    
    // Candidatos - solo visualización
    "ver_candidatos",
    
    // Clientes - solo visualización
    "ver_clientes",
    "ver_empresas_afiliadas",
    
    // Reportes - solo visualización
    "ver_reportes"
  ],
  
  cliente: [
    // Dashboard
    "ver_dashboard",
    "ver_dashboard_cliente",
    
    // Candidatos - gestión de sus propios candidatos
    "ver_candidatos",
    "crear_candidatos",
    "editar_candidatos",
    
    // Órdenes - solo ver sus órdenes
    "ver_ordenes",
    "crear_ordenes",
    
    // Reportes - solo sus reportes
    "ver_reportes"
  ],
  
  candidato: [
    // Dashboard personal
    "ver_dashboard",
    
    // Solo información personal
    "ver_informacion_personal",
    "editar_informacion_personal"
  ]
};

// Estructura de menús del sistema
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  permission: Permission;
  children?: MenuItem[];
}

export const systemMenus: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "BarChart3",
    path: "/dashboard",
    permission: "ver_dashboard"
  },

  {
    id: "seguridad",
    label: "Seguridad",
    icon: "Shield",
    permission: "ver_usuarios",
    children: [
      {
        id: "usuarios",
        label: "Usuarios",
        icon: "Users",
        path: "/seguridad/usuarios",
        permission: "ver_usuarios"
      },
      {
        id: "perfiles",
        label: "Perfiles",
        icon: "UserCheck",
        path: "/seguridad/perfiles",
        permission: "ver_perfiles"
      },
      {
        id: "permisos",
        label: "Gestión de Permisos",
        icon: "Shield",
        path: "/seguridad/permisos",
        permission: "gestionar_permisos"
      }
    ]
  },
  {
    id: "maestros",
    label: "Maestro",
    icon: "Settings",
    path: "/maestro",
    permission: "ver_maestros"
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: "Building2",
    permission: "ver_clientes",
    children: [
      {
        id: "empresas-afiliadas",
        label: "Empresas Afiliadas",
        icon: "Building",
        path: "/clientes/empresas-afiliadas",
        permission: "ver_empresas_afiliadas"
      }
    ]
  },
  {
    id: "analistas",
    label: "Analistas",
    icon: "UserCheck",
    path: "/analistas",
    permission: "ver_analistas"
  },
  {
    id: "ordenes",
    label: "Órdenes",
    icon: "FileText",
    permission: "expedicion_orden",
    children: [
      {
        id: "expedicion-orden",
        label: "Expedición de Orden",
        icon: "FileText",
        path: "/ordenes/expedicion",
        permission: "expedicion_orden"
      },
      {
        id: "templates-orden",
        label: "Configurar Plantillas",
        icon: "Settings",
        path: "/ordenes/templates",
        permission: "gestionar_templates_ordenes"
      }
    ]
  },
  {
    id: "expedicion-certificados",
    label: "Expedición de Certificados",
    icon: "Award",
    path: "/certificados",
    permission: "expedicion_certificados"
  },
  {
    id: "reportes",
    label: "Reportes",
    icon: "BarChart",
    path: "/reportes",
    permission: "ver_reportes"
  },
  {
    id: "candidatos",
    label: "Candidatos",
    icon: "Users",
    path: "/candidatos",
    permission: "ver_candidatos"
  },
  {
    id: "informacion-personal",
    label: "Información Personal",
    icon: "User",
    path: "/perfil",
    permission: "ver_informacion_personal"
  }
];

// Función para obtener permisos del usuario (rol base + permisos adicionales)
export function getUserPermissions(role: UserRole, additionalPermissions: Permission[] = []): Permission[] {
  const basePermissions = rolePermissions[role] || [];
  const allPermissions = [...basePermissions, ...additionalPermissions];
  
  // Remover duplicados
  return Array.from(new Set(allPermissions));
}

// Función para verificar si el usuario tiene un permiso específico
export function hasPermission(userPermissions: Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

// Función para filtrar menús según permisos del usuario
export function getFilteredMenus(userPermissions: Permission[]): MenuItem[] {
  function filterMenu(menu: MenuItem): MenuItem | null {
    if (!hasPermission(userPermissions, menu.permission)) {
      return null;
    }
    
    if (menu.children) {
      const filteredChildren = menu.children
        .map(child => filterMenu(child))
        .filter(child => child !== null) as MenuItem[];
        
      return {
        ...menu,
        children: filteredChildren.length > 0 ? filteredChildren : undefined
      };
    }
    
    return menu;
  }
  
  return systemMenus
    .map(menu => filterMenu(menu))
    .filter(menu => menu !== null) as MenuItem[];
}

// Función para determinar dashboard por defecto según rol
export function getDefaultDashboard(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "analista":
      return "/dashboard";
    case "cliente":
      return "/empresa/dashboard";
    case "candidato":
      return "/candidato/perfil";
    default:
      return "/dashboard";
  }
}