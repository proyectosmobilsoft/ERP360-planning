import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield, Settings, Eye } from "lucide-react";

interface ViewAction {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  tipo: string;
  orden: number;
  activo: boolean;
}

interface SystemView {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  ruta: string;
  modulo: string;
  icono: string;
  orden: number;
  activo: boolean;
  acciones: ViewAction[];
}

const GestionPermisosPage: React.FC = () => {
  const [selectedVistaId, setSelectedVistaId] = useState<number | null>(null);
  const [showMockData, setShowMockData] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Set<number>>(new Set());
  const [showPermissionsTable, setShowPermissionsTable] = useState(false);

  // Query para obtener todas las vistas con sus acciones
  const { data: viewsWithActions, isLoading: viewsLoading } = useQuery<SystemView[]>({
    queryKey: ['/api/views-with-actions'],
    select: (data: SystemView[]) => {
      // Ordenar por módulo y luego por orden
      return [...data].sort((a, b) => {
        if (a.modulo !== b.modulo) {
          return a.modulo.localeCompare(b.modulo);
        }
        return a.orden - b.orden;
      });
    }
  });

  // Mock data con todas las acciones del sistema
  const mockViewsWithActions: SystemView[] = [
    {
      id: 1,
      nombre: "dashboard",
      displayName: "Dashboard General",
      descripcion: "Panel principal del sistema",
      ruta: "/admin/dashboard",
      modulo: "GENERAL",
      icono: "dashboard",
      orden: 1,
      activo: true,
      acciones: [
        { id: 1, nombre: "ver_dashboard", displayName: "Ver Dashboard", descripcion: "Acceso al panel principal", tipo: "visualizacion", orden: 1, activo: true },
        { id: 2, nombre: "ver_estadisticas", displayName: "Ver Estadísticas", descripcion: "Visualizar métricas del sistema", tipo: "visualizacion", orden: 2, activo: true },
        { id: 3, nombre: "exportar_dashboard", displayName: "Exportar Dashboard", descripcion: "Exportar datos del dashboard", tipo: "exportacion", orden: 3, activo: true }
      ]
    },
    {
      id: 2,
      nombre: "usuarios",
      displayName: "Gestión de Usuarios",
      descripcion: "Administración de usuarios del sistema",
      ruta: "/admin/usuarios",
      modulo: "SEGURIDAD",
      icono: "users",
      orden: 1,
      activo: true,
      acciones: [
        { id: 4, nombre: "ver_usuarios", displayName: "Ver Usuarios", descripcion: "Listar todos los usuarios", tipo: "visualizacion", orden: 1, activo: true },
        { id: 5, nombre: "crear_usuario", displayName: "Crear Usuario", descripcion: "Registrar nuevos usuarios", tipo: "creacion", orden: 2, activo: true },
        { id: 6, nombre: "editar_usuario", displayName: "Editar Usuario", descripcion: "Modificar datos de usuarios", tipo: "edicion", orden: 3, activo: true },
        { id: 7, nombre: "eliminar_usuario", displayName: "Eliminar Usuario", descripcion: "Desactivar o eliminar usuarios", tipo: "eliminacion", orden: 4, activo: true },
        { id: 8, nombre: "resetear_password", displayName: "Resetear Contraseña", descripcion: "Restablecer contraseñas de usuario", tipo: "especial", orden: 5, activo: true }
      ]
    },
    {
      id: 3,
      nombre: "perfiles",
      displayName: "Perfiles de Usuario",
      descripcion: "Gestión de perfiles y roles",
      ruta: "/admin/perfiles",
      modulo: "SEGURIDAD",
      icono: "user-circle",
      orden: 2,
      activo: true,
      acciones: [
        { id: 9, nombre: "ver_perfiles", displayName: "Ver Perfiles", descripcion: "Listar perfiles de usuario", tipo: "visualizacion", orden: 1, activo: true },
        { id: 10, nombre: "crear_perfil", displayName: "Crear Perfil", descripcion: "Crear nuevos perfiles", tipo: "creacion", orden: 2, activo: true },
        { id: 11, nombre: "editar_perfil", displayName: "Editar Perfil", descripcion: "Modificar perfiles existentes", tipo: "edicion", orden: 3, activo: true },
        { id: 12, nombre: "eliminar_perfil", displayName: "Eliminar Perfil", descripcion: "Eliminar perfiles de usuario", tipo: "eliminacion", orden: 4, activo: true }
      ]
    },
    {
      id: 4,
      nombre: "candidatos",
      displayName: "Gestión de Candidatos",
      descripcion: "Administración de candidatos",
      ruta: "/admin/candidatos",
      modulo: "REGISTROS",
      icono: "user-plus",
      orden: 1,
      activo: true,
      acciones: [
        { id: 13, nombre: "ver_candidatos", displayName: "Ver Candidatos", descripcion: "Listar candidatos", tipo: "visualizacion", orden: 1, activo: true },
        { id: 14, nombre: "crear_candidato", displayName: "Crear Candidato", descripcion: "Registrar nuevos candidatos", tipo: "creacion", orden: 2, activo: true },
        { id: 15, nombre: "editar_candidato", displayName: "Editar Candidato", descripcion: "Modificar datos de candidatos", tipo: "edicion", orden: 3, activo: true },
        { id: 16, nombre: "eliminar_candidato", displayName: "Eliminar Candidato", descripcion: "Eliminar candidatos", tipo: "eliminacion", orden: 4, activo: true },
        { id: 17, nombre: "aprobar_candidato", displayName: "Aprobar Candidato", descripcion: "Aprobar solicitudes de candidatos", tipo: "aprobacion", orden: 5, activo: true }
      ]
    },
    {
      id: 5,
      nombre: "empresas",
      displayName: "Empresas Afiliadas",
      descripcion: "Gestión de empresas cliente",
      ruta: "/admin/empresas",
      modulo: "EMPRESA",
      icono: "building",
      orden: 1,
      activo: true,
      acciones: [
        { id: 18, nombre: "ver_empresas", displayName: "Ver Empresas", descripcion: "Listar empresas afiliadas", tipo: "visualizacion", orden: 1, activo: true },
        { id: 19, nombre: "crear_empresa", displayName: "Crear Empresa", descripcion: "Registrar nuevas empresas", tipo: "creacion", orden: 2, activo: true },
        { id: 20, nombre: "editar_empresa", displayName: "Editar Empresa", descripcion: "Modificar datos de empresas", tipo: "edicion", orden: 3, activo: true },
        { id: 21, nombre: "eliminar_empresa", displayName: "Eliminar Empresa", descripcion: "Desactivar empresas", tipo: "eliminacion", orden: 4, activo: true }
      ]
    },
    {
      id: 6,
      nombre: "qr",
      displayName: "Códigos QR",
      descripcion: "Gestión de códigos QR",
      ruta: "/admin/qr",
      modulo: "RECURSOS",
      icono: "qr-code",
      orden: 1,
      activo: true,
      acciones: [
        { id: 22, nombre: "ver_qr", displayName: "Ver Códigos QR", descripcion: "Visualizar códigos QR", tipo: "visualizacion", orden: 1, activo: true },
        { id: 23, nombre: "generar_qr", displayName: "Generar QR", descripcion: "Crear nuevos códigos QR", tipo: "creacion", orden: 2, activo: true },
        { id: 24, nombre: "eliminar_qr", displayName: "Eliminar QR", descripcion: "Eliminar códigos QR", tipo: "eliminacion", orden: 3, activo: true }
      ]
    },
    {
      id: 7,
      nombre: "analistas",
      displayName: "Gestión de Analistas",
      descripcion: "Administración de analistas",
      ruta: "/admin/analistas",
      modulo: "RECURSOS",
      icono: "user-check",
      orden: 2,
      activo: true,
      acciones: [
        { id: 25, nombre: "ver_analistas", displayName: "Ver Analistas", descripcion: "Listar analistas", tipo: "visualizacion", orden: 1, activo: true },
        { id: 26, nombre: "crear_analista", displayName: "Crear Analista", descripcion: "Registrar nuevos analistas", tipo: "creacion", orden: 2, activo: true },
        { id: 27, nombre: "editar_analista", displayName: "Editar Analista", descripcion: "Modificar datos de analistas", tipo: "edicion", orden: 3, activo: true },
        { id: 28, nombre: "eliminar_analista", displayName: "Eliminar Analista", descripcion: "Eliminar analistas", tipo: "eliminacion", orden: 4, activo: true },
        { id: 29, nombre: "asignar_casos", displayName: "Asignar Casos", descripcion: "Asignar casos a analistas", tipo: "especial", orden: 5, activo: true }
      ]
    },
    {
      id: 8,
      nombre: "ordenes",
      displayName: "Expedición de Órdenes",
      descripcion: "Gestión de órdenes médicas",
      ruta: "/admin/ordenes",
      modulo: "ORDENES",
      icono: "file-text",
      orden: 1,
      activo: true,
      acciones: [
        { id: 30, nombre: "ver_ordenes", displayName: "Ver Órdenes", descripcion: "Listar órdenes médicas", tipo: "visualizacion", orden: 1, activo: true },
        { id: 31, nombre: "crear_orden", displayName: "Crear Orden", descripcion: "Generar nuevas órdenes", tipo: "creacion", orden: 2, activo: true },
        { id: 32, nombre: "editar_orden", displayName: "Editar Orden", descripcion: "Modificar órdenes existentes", tipo: "edicion", orden: 3, activo: true },
        { id: 33, nombre: "eliminar_orden", displayName: "Eliminar Orden", descripcion: "Cancelar órdenes", tipo: "eliminacion", orden: 4, activo: true },
        { id: 34, nombre: "firmar_orden", displayName: "Firmar Orden", descripcion: "Firmar órdenes médicas", tipo: "aprobacion", orden: 5, activo: true }
      ]
    },
    {
      id: 9,
      nombre: "certificados",
      displayName: "Expedición de Certificados",
      descripcion: "Gestión de certificados médicos",
      ruta: "/admin/certificados",
      modulo: "CERTIFICADOS",
      icono: "award",
      orden: 1,
      activo: true,
      acciones: [
        { id: 35, nombre: "ver_certificados", displayName: "Ver Certificados", descripcion: "Listar certificados", tipo: "visualizacion", orden: 1, activo: true },
        { id: 36, nombre: "crear_certificado", displayName: "Crear Certificado", descripcion: "Generar certificados", tipo: "creacion", orden: 2, activo: true },
        { id: 37, nombre: "editar_certificado", displayName: "Editar Certificado", descripcion: "Modificar certificados", tipo: "edicion", orden: 3, activo: true },
        { id: 38, nombre: "eliminar_certificado", displayName: "Eliminar Certificado", descripcion: "Anular certificados", tipo: "eliminacion", orden: 4, activo: true },
        { id: 39, nombre: "firmar_certificado", displayName: "Firmar Certificado", descripcion: "Firmar certificados médicos", tipo: "aprobacion", orden: 5, activo: true }
      ]
    },
    {
      id: 10,
      nombre: "maestro",
      displayName: "Configuración Maestro",
      descripcion: "Gestión de datos maestros",
      ruta: "/admin/maestro",
      modulo: "CONFIGURACION",
      icono: "settings",
      orden: 1,
      activo: true,
      acciones: [
        { id: 40, nombre: "ver_maestro", displayName: "Ver Configuración", descripcion: "Visualizar configuraciones", tipo: "visualizacion", orden: 1, activo: true },
        { id: 41, nombre: "editar_maestro", displayName: "Editar Configuración", descripcion: "Modificar configuraciones", tipo: "edicion", orden: 2, activo: true },
        { id: 42, nombre: "exportar_maestro", displayName: "Exportar Configuración", descripcion: "Exportar datos maestros", tipo: "exportacion", orden: 3, activo: true }
      ]
    },
    {
      id: 11,
      nombre: "reportes",
      displayName: "Reportes y Análisis",
      descripcion: "Generación de reportes",
      ruta: "/admin/reportes",
      modulo: "REPORTES",
      icono: "bar-chart",
      orden: 1,
      activo: true,
      acciones: [
        { id: 43, nombre: "ver_reportes", displayName: "Ver Reportes", descripcion: "Visualizar reportes", tipo: "visualizacion", orden: 1, activo: true },
        { id: 44, nombre: "generar_reporte", displayName: "Generar Reporte", descripcion: "Crear nuevos reportes", tipo: "creacion", orden: 2, activo: true },
        { id: 45, nombre: "exportar_reporte", displayName: "Exportar Reporte", descripcion: "Exportar reportes en diferentes formatos", tipo: "exportacion", orden: 3, activo: true },
        { id: 46, nombre: "programar_reporte", displayName: "Programar Reporte", descripcion: "Programar generación automática", tipo: "especial", orden: 4, activo: true }
      ]
    }
  ];

  const dataToUse = showMockData ? mockViewsWithActions : (viewsWithActions || []);

  const toggleAction = (actionId: number) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(actionId)) {
      newSelected.delete(actionId);
    } else {
      newSelected.add(actionId);
    }
    setSelectedActions(newSelected);
  };

  const toggleAllActions = () => {
    const allActionIds = dataToUse.flatMap(v => v.acciones.map(a => a.id));
    if (selectedActions.size === allActionIds.length) {
      setSelectedActions(new Set());
    } else {
      setSelectedActions(new Set(allActionIds));
    }
  };

  const toggleAllActionsInView = (vista: SystemView) => {
    const viewActionIds = vista.acciones.map(a => a.id);
    const newSelected = new Set(selectedActions);
    
    const allViewActionsSelected = viewActionIds.every(id => newSelected.has(id));
    
    if (allViewActionsSelected) {
      viewActionIds.forEach(id => newSelected.delete(id));
    } else {
      viewActionIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedActions(newSelected);
  };

  const getModuleColor = (modulo: string) => {
    const colors: Record<string, string> = {
      'GENERAL': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'SEGURIDAD': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'REGISTROS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'EMPRESA': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'RECURSOS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'ORDENES': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'CERTIFICADOS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'CONFIGURACION': 'bg-brand-gray/10 text-brand-gray border-brand-gray/20',
      'REPORTES': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20'
    };
    return colors[modulo] || 'bg-brand-gray/10 text-brand-gray border-brand-gray/20';
  };

  const getActionTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'visualizacion': 'bg-cyan-100 text-cyan-800',
      'creacion': 'bg-brand-lime/10 text-brand-lime',
      'edicion': 'bg-yellow-100 text-yellow-800',
      'eliminacion': 'bg-red-100 text-red-800',
      'exportacion': 'bg-purple-100 text-purple-800',
      'aprobacion': 'bg-orange-100 text-orange-800',
      'especial': 'bg-indigo-100 text-indigo-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (viewsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando vistas del sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-brand-lime" />
          <h1 className="text-3xl font-bold text-gray-800">Explorador de Vistas y Acciones</h1>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Sistema completo de permisos con {dataToUse.length} vistas y {dataToUse.reduce((sum, v) => sum + v.acciones.length, 0)} acciones totales organizadas por módulos.
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Fuente de datos:</label>
            <Select value={showMockData ? "mock" : "database"} onValueChange={(value) => setShowMockData(value === "mock")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="database">Base de datos</SelectItem>
                <SelectItem value="mock">Datos Mock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Asignación de Permisos */}
      {dataToUse.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Checkbox 
                  checked={selectedActions.size > 0}
                  onCheckedChange={toggleAllActions}
                  className="mr-2"
                />
                <span>Configuración de Permisos por Acción</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {selectedActions.size} de {dataToUse.reduce((sum, v) => sum + v.acciones.length, 0)} acciones seleccionadas
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPermissionsTable(!showPermissionsTable)}
                >
                  {showPermissionsTable ? 'Ocultar Tabla' : 'Mostrar Tabla'}
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Selecciona las acciones que estarán disponibles para los usuarios. Usa los checkboxes para configurar permisos granulares.
            </div>
          </CardHeader>
          
          {showPermissionsTable && (
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <Checkbox 
                            checked={selectedActions.size === dataToUse.reduce((sum, v) => sum + v.acciones.length, 0)}
                            onCheckedChange={toggleAllActions}
                          />
                        </th>
                        <th className="px-4 py-3 text-left">Vista</th>
                        <th className="px-4 py-3 text-left">Acción</th>
                        <th className="px-4 py-3 text-left">Tipo</th>
                        <th className="px-4 py-3 text-left">Módulo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataToUse.map((vista) => 
                        vista.acciones.map((accion) => {
                          const isSelected = selectedActions.has(accion.id);
                          return (
                            <tr 
                              key={`${vista.id}-${accion.id}`} 
                              className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-brand-lime/10' : ''}`}
                            >
                              <td className="px-4 py-2">
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={() => toggleAction(accion.id)}
                                />
                              </td>
                              <td className="px-4 py-2 font-medium">{vista.displayName}</td>
                              <td className="px-4 py-2">{accion.displayName}</td>
                              <td className="px-4 py-2">
                                <Badge className={getActionTypeColor(accion.tipo)} variant="outline">
                                  {accion.tipo}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <Badge className={getModuleColor(vista.modulo)} variant="outline">
                                  {vista.modulo}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Panel de resumen */}
                <div className="p-4 bg-gray-50 border-t">
                  <h4 className="font-medium mb-3">Resumen de Selección por Vista</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dataToUse.map((vista) => {
                      const selectedInView = vista.acciones.filter(a => selectedActions.has(a.id));
                      return (
                        <div key={vista.id} className="p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{vista.displayName}</span>
                            <Checkbox 
                              checked={selectedInView.length === vista.acciones.length && vista.acciones.length > 0}
                              onCheckedChange={() => toggleAllActionsInView(vista)}
                              className="h-4 w-4"
                            />
                          </div>
                          <div className="text-xs text-gray-600">
                            {selectedInView.map(a => a.displayName).join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Estadísticas: {dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => selectedActions.has(a.id) && a.tipo === 'visualizacion').length, 0)} Ver, 
                      {dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => selectedActions.has(a.id) && a.tipo === 'creacion').length, 0)} Crear, 
                      {dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => selectedActions.has(a.id) && a.tipo === 'edicion').length, 0)} Editar, 
                      {dataToUse.reduce((sum, v) => sum + v.acciones.filter(a => selectedActions.has(a.id) && a.tipo === 'eliminacion').length, 0)} Eliminar
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedActions(new Set())}>
                        Limpiar Selección
                      </Button>
                      <Button size="sm" className="bg-brand-lime hover:bg-brand-lime/90">
                        Guardar Permisos
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default GestionPermisosPage;