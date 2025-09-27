
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { Users, Shield, Key, Activity, TrendingUp, UserCheck, UserX, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  totalRoles: number;
  totalPermisos: number;
  distribucionUsuarios: Array<{ tipo: string; cantidad: number }>;
  distribucionRoles: Array<{ tipo: string; cantidad: number }>;
}

const COLORS = ['#0891b2', '#0d9488', '#059669', '#7c3aed', '#dc2626'];

const Index = () => {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Obtener estadísticas de usuarios
        const { data: usuarios, error: usuariosError } = await supabase
          .from('gen_usuarios')
          .select('id, activo');

        if (usuariosError) throw usuariosError;

        // Obtener estadísticas de roles
        const { data: roles, error: rolesError } = await supabase
          .from('gen_roles')
          .select('id, nombre');

        if (rolesError) throw rolesError;

        // Obtener estadísticas de permisos
        const { data: permisos, error: permisosError } = await supabase
          .from('gen_modulo_permisos')
          .select('id');

        if (permisosError) throw permisosError;

        const totalUsuarios = usuarios?.length || 0;
        const usuariosActivos = usuarios?.filter(u => u.activo).length || 0;
        const usuariosInactivos = totalUsuarios - usuariosActivos;
        const totalRoles = roles?.length || 0;
        const totalPermisos = permisos?.length || 0;

        // Distribución de usuarios por estado
        const distribucionUsuarios = [
          { tipo: 'Activos', cantidad: usuariosActivos },
          { tipo: 'Inactivos', cantidad: usuariosInactivos }
        ];

        // Distribución de roles (top 5)
        const distribucionRoles = roles?.slice(0, 5).map(rol => ({
          tipo: rol.nombre,
          cantidad: usuarios?.filter(u => u.activo).length || 0 // Simplificado por ahora
        })) || [];

        return {
          totalUsuarios,
          usuariosActivos,
          usuariosInactivos,
          totalRoles,
          totalPermisos,
          distribucionUsuarios,
          distribucionRoles
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="p-4 max-w-full mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Activity className="animate-spin h-10 w-10 text-cyan-600" />
            <span className="text-cyan-700 font-semibold">Cargando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-full mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error al cargar las estadísticas del dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Activity className="w-8 h-8 text-cyan-600" />
          Dashboard del Sistema
        </h1>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              Total de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalUsuarios || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Usuarios registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card className="border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              Usuarios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.usuariosActivos || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Usuarios con acceso activo</p>
          </CardContent>
        </Card>

        <Card className="border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              Total de Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.totalRoles || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Roles de seguridad definidos</p>
          </CardContent>
        </Card>

        <Card className="border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              Total de Permisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.totalPermisos || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Permisos del sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas de Análisis */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Vista General
          </TabsTrigger>
          <TabsTrigger
            value="usuarios"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Análisis de Usuarios
          </TabsTrigger>
          <TabsTrigger
            value="seguridad"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Estado de Seguridad
          </TabsTrigger>
        </TabsList>

        {/* Pestaña Vista General */}
        <TabsContent value="general" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Distribución de Usuarios */}
            <Card className="border border-cyan-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center">
                    <PieChartIcon className="w-4 h-4 text-cyan-600" />
                  </div>
                  Distribución de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.distribucionUsuarios || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ tipo, porcentaje }) => `${tipo}: ${porcentaje}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cantidad"
                    >
                      {stats?.distribucionUsuarios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumen del Sistema */}
            <Card className="border border-cyan-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-cyan-600" />
                  </div>
                  Resumen del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Estado General</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Operativo
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Usuarios Activos</span>
                    <span className="text-sm font-semibold text-green-600">
                      {stats?.usuariosActivos || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Usuarios Inactivos</span>
                    <span className="text-sm font-semibold text-red-600">
                      {stats?.usuariosInactivos || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Roles del Sistema</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {stats?.totalRoles || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Permisos Totales</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {stats?.totalPermisos || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña Análisis de Usuarios */}
        <TabsContent value="usuarios" className="mt-6">
          <Card className="border border-cyan-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-cyan-600" />
                </div>
                Estadísticas de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={stats?.distribucionUsuarios || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#0891b2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña Estado de Seguridad */}
        <TabsContent value="seguridad" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estado de Usuarios */}
            <Card className="border border-cyan-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center">
                    <Users className="w-4 h-4 text-cyan-600" />
                  </div>
                  Estado de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Usuarios Activos</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{stats?.usuariosActivos || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Usuarios Inactivos</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">{stats?.usuariosInactivos || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de Roles y Permisos */}
            <Card className="border border-cyan-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center">
                    <Shield className="w-4 h-4 text-cyan-600" />
                  </div>
                  Roles y Permisos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Roles del Sistema</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{stats?.totalRoles || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Permisos Totales</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">{stats?.totalPermisos || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
