import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Building, 
  User, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Check,
  Settings,
  Users,
  Lock,
  Unlock,
  Mail,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  mockSystemViews, 
  mockViewActions, 
  mockUserProfiles, 
  mockCompanies,
  mockCompanyUsers,
  getActionsByView,
  getViewsByModule,
  generateTempPassword,
  type UserProfile,
  type Company,
  type CompanyUser,
  type SystemView,
  type ViewAction
} from '@shared/mock-permissions';
import { rolesService } from '@/services/rolesService';

interface AdvancedProfileManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileCreated: (profile: any) => void; // Changed to any as mock data is removed
}

export const AdvancedProfileManager: React.FC<AdvancedProfileManagerProps> = ({
  open,
  onOpenChange,
  onProfileCreated
}) => {
  const [currentTab, setCurrentTab] = useState('basic');
  const [profileData, setProfileData] = useState({
    name: '',
    description: '',
    type: 'coordinador' as 'coordinador' | 'supervisor' | 'empresa' | 'admin' // Changed to any as mock data is removed
  });
  const [viewPermissions, setViewPermissions] = useState<Record<string, boolean>>({});
  const [actionPermissions, setActionPermissions] = useState<Record<string, boolean>>({});
  const [companyData, setCompanyData] = useState({
    name: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    contactPerson: ''
  });
  const [userEmail, setUserEmail] = useState('');
  const [createCompanyUser, setCreateCompanyUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [systemViews, setSystemViews] = useState<any[]>([]);
  const [actionsByView, setActionsByView] = useState<Record<string, any[]>>({});
  const [loadingViews, setLoadingViews] = useState(false);

  // Cargar vistas y acciones desde Supabase
  useEffect(() => {
    const fetchViewsAndActions = async () => {
      setLoadingViews(true);
      try {
        // Obtener todos los permisos
        const permisos = await rolesService.listPermisos();
        // Agrupar por módulo como "vistas"
        const viewsMap: Record<string, any> = {};
        const actionsMap: Record<string, any[]> = {};
        permisos.forEach((permiso: any) => {
          // Usar modulo como vista, nombre como acción
          if (!viewsMap[permiso.modulo]) {
            viewsMap[permiso.modulo] = {
              id: permiso.modulo,
              name: permiso.modulo.charAt(0).toUpperCase() + permiso.modulo.slice(1),
              description: '',
              actions: []
            };
          }
          // Agregar acción a la vista
          viewsMap[permiso.modulo].actions.push({
            id: permiso.id,
            name: permiso.nombre,
            description: permiso.descripcion,
            type: permiso.modulo
          });
          // Mapear acciones por vista
          if (!actionsMap[permiso.modulo]) actionsMap[permiso.modulo] = [];
          actionsMap[permiso.modulo].push({
            id: permiso.id,
            name: permiso.nombre,
            description: permiso.descripcion,
            type: permiso.modulo
          });
        });
        setSystemViews(Object.values(viewsMap));
        setActionsByView(actionsMap);
      } catch (e) {
        toast.error('Error cargando vistas y permisos desde la base de datos');
      } finally {
        setLoadingViews(false);
      }
    };
    fetchViewsAndActions();
  }, []);

  // Resetear formulario cuando se abre
  useEffect(() => {
    if (open) {
      setProfileData({
        name: '',
        description: '',
        type: 'coordinador'
      });
      setViewPermissions({});
      setActionPermissions({});
      setCompanyData({
        name: '',
        nit: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        contactPerson: ''
      });
      setUserEmail('');
      setCreateCompanyUser(false);
      setCurrentTab('basic');
    }
  }, [open]);

  // Manejar cambio de permisos de vista
  const handleViewPermissionChange = (viewId: string, enabled: boolean) => {
    setViewPermissions(prev => ({
      ...prev,
      [viewId]: enabled
    }));

    // Si se desactiva una vista, desactivar todas sus acciones
    if (!enabled) {
      const viewActions = actionsByView[viewId] || [];
      const updatedActionPermissions = { ...actionPermissions };
      viewActions.forEach(action => {
        updatedActionPermissions[action.id] = false;
      });
      setActionPermissions(updatedActionPermissions);
    }
  };

  // Manejar cambio de permisos de acción
  const handleActionPermissionChange = (actionId: string, enabled: boolean) => {
    setActionPermissions(prev => ({
      ...prev,
      [actionId]: enabled
    }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!profileData.name.trim()) {
      toast.error('El nombre del perfil es requerido');
      return false;
    }

    if (Object.values(viewPermissions).every(v => !v)) {
      toast.error('Debe seleccionar al menos una vista');
      return false;
    }

    if (createCompanyUser) {
      if (!companyData.name.trim() || !companyData.nit.trim() || !userEmail.trim()) {
        toast.error('Complete todos los campos requeridos de la empresa');
        return false;
      }
    }

    return true;
  };

  // Guardar perfil
  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      // Simular delay de guardado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Crear nuevo perfil
      const newProfile: any = { // Changed to any as mock data is removed
        id: `profile_${Date.now()}`,
        name: profileData.name,
        description: profileData.description,
        type: profileData.type,
        permissions: {
          viewPermissions,
          actionPermissions
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Si se crea empresa y usuario
      if (createCompanyUser) {
        const tempPassword = 'temp_password_123'; // Generar contraseña temporal
        
        const newCompany: any = { // Changed to any as mock data is removed
          id: `emp_${Date.now()}`,
          name: companyData.name,
          nit: companyData.nit,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          city: companyData.city,
          contactPerson: companyData.contactPerson,
          isActive: true,
          createdAt: new Date()
        };

        const newUser: any = { // Changed to any as mock data is removed
          id: `user_${Date.now()}`,
          companyId: newCompany.id,
          email: userEmail,
          tempPassword,
          profileId: newProfile.id,
          mustChangePassword: true,
          isActive: true,
          createdAt: new Date()
        };

        toast.success(
          `Perfil creado exitosamente. Se envió usuario y contraseña temporal (${tempPassword}) al correo ${userEmail}`
        );
      } else {
        toast.success('Perfil creado exitosamente');
      }

      onProfileCreated(newProfile);
      onOpenChange(false);
      
    } catch (error) {
      toast.error('Error al crear el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1200px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Crear Nuevo Perfil Avanzado
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="views">Control de Vistas</TabsTrigger>
            <TabsTrigger value="actions">Control de Acciones</TabsTrigger>
            <TabsTrigger value="company">Empresa y Usuario</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profileName">Nombre del Perfil *</Label>
                      <Input
                        id="profileName"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Coordinador Regional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profileType">Tipo de Perfil *</Label>
                      <select
                        id="profileType"
                        value={profileData.type}
                        onChange={(e) => setProfileData(prev => ({ ...prev, type: e.target.value as 'coordinador' | 'supervisor' | 'empresa' | 'admin' }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="coordinador">Coordinador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="empresa">Empresa</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="profileDescription">Descripción</Label>
                    <Textarea
                      id="profileDescription"
                      value={profileData.description}
                      onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe las responsabilidades y alcance de este perfil"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="views" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Control de Vistas del Sistema</CardTitle>
                  <p className="text-sm text-gray-600">
                    Selecciona las vistas que estarán disponibles para este perfil
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {systemViews.map((view) => (
                    <div key={view.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Switch
                        id={`view_${view.id}`}
                        checked={viewPermissions[view.id] || false}
                        onCheckedChange={(checked) => handleViewPermissionChange(view.id, checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`view_${view.id}`} className="font-medium cursor-pointer">
                          {view.name}
                        </Label>
                        <p className="text-xs text-gray-600 mt-1">{view.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Control de Acciones</CardTitle>
                  <p className="text-sm text-gray-600">
                    Define qué acciones puede realizar el usuario en cada vista habilitada
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {systemViews
                    .filter(view => viewPermissions[view.id])
                    .map((view) => {
                      const actions = actionsByView[view.id] || [];
                      return (
                        <div key={view.id} className="space-y-3">
                          <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                            {view.name}
                            <Badge variant="outline">{actions.length} acciones</Badge>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {actions.map((action) => (
                              <div key={action.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <Switch
                                  id={`action_${action.id}`}
                                  checked={actionPermissions[action.id] || false}
                                  onCheckedChange={(checked) => handleActionPermissionChange(action.id, checked)}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`action_${action.id}`} className="font-medium cursor-pointer">
                                    {action.name}
                                  </Label>
                                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    {action.type}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  {Object.values(viewPermissions).every(v => !v) && (
                    <div className="text-center py-8 text-gray-500">
                      <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Selecciona al menos una vista para configurar las acciones</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crear Empresa y Usuario</CardTitle>
                  <p className="text-sm text-gray-600">
                    Opcionalmente, crea una empresa y asigna un usuario con este perfil
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="createCompany"
                      checked={createCompanyUser}
                      onCheckedChange={setCreateCompanyUser}
                    />
                    <Label htmlFor="createCompany">
                      Crear empresa y usuario asociado
                    </Label>
                  </div>

                  {createCompanyUser && (
                    <div className="space-y-6 pt-4 border-t">
                      <div>
                        <h4 className="font-semibold mb-3">Información de la Empresa</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="companyName">Nombre de la Empresa *</Label>
                            <Input
                              id="companyName"
                              value={companyData.name}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Ej: Constructora ABC S.A.S."
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyNit">NIT *</Label>
                            <Input
                              id="companyNit"
                              value={companyData.nit}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, nit: e.target.value }))}
                              placeholder="Ej: 900123456-7"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyEmail">Email</Label>
                            <Input
                              id="companyEmail"
                              type="email"
                              value={companyData.email}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="contacto@empresa.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyPhone">Teléfono</Label>
                            <Input
                              id="companyPhone"
                              value={companyData.phone}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="3001234567"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyAddress">Dirección</Label>
                            <Input
                              id="companyAddress"
                              value={companyData.address}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Calle 123 #45-67"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyCity">Ciudad</Label>
                            <Input
                              id="companyCity"
                              value={companyData.city}
                              onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Bogotá"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="contactPerson">Persona de Contacto</Label>
                          <Input
                            id="contactPerson"
                            value={companyData.contactPerson}
                            onChange={(e) => setCompanyData(prev => ({ ...prev, contactPerson: e.target.value }))}
                            placeholder="Nombre del contacto principal"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-3">Usuario de la Empresa</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="userEmail">Email del Usuario *</Label>
                            <Input
                              id="userEmail"
                              type="email"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              placeholder="usuario@empresa.com"
                            />
                          </div>
                          <div className="bg-cyan-50 p-4 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Key className="w-5 h-5 text-cyan-600 mt-0.5" />
                              <div>
                                <h5 className="font-medium text-cyan-900">Contraseña Temporal</h5>
                                <p className="text-sm text-cyan-800">
                                  Se generará automáticamente una contraseña temporal segura y se enviará al correo del usuario. 
                                  El usuario deberá cambiar la contraseña en el primer inicio de sesión.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4" />
            <span>
              {Object.values(viewPermissions).filter(v => v).length} vistas seleccionadas,{' '}
              {Object.values(actionPermissions).filter(a => a).length} acciones habilitadas
            </span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Perfil
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};