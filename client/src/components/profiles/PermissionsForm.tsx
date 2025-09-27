import React, { useEffect, useState } from "react";
import { Check, X, Edit, Eye, Plus, Trash2, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { rolesService } from '@/services/rolesService';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PermissionsFormProps {
  selectedPermissions: {
    viewId: string;
    viewName: string;
    actions: string[];
  }[];
  onPermissionsChange: (permissions: {
    viewId: string;
    viewName: string;
    actions: string[];
  }[]) => void;
}

interface SystemView {
  codigo: string; // ID del módulo
  nombre: string; // Nombre del módulo
  acciones: {
    id: number; // ID numérico del permiso (desde modulo_permisos.id)
    codigo: string; // Código programático del permiso (desde modulo_permisos.code)
    nombre: string; // Nombre amigable del permiso (desde modulo_permisos.nombre)
    description?: string; // Descripción del permiso
  }[];
}

const actionIcons = {
  view: <Eye className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  edit: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  manage: <Users className="h-4 w-4" />,
  custom: <Filter className="h-4 w-4" />
};

const getActionIcon = (actionCode: string) => {
  if (actionCode.includes('view') || actionCode.includes('ver')) return actionIcons.view;
  if (actionCode.includes('create') || actionCode.includes('crear')) return actionIcons.create;
  if (actionCode.includes('edit') || actionCode.includes('editar')) return actionIcons.edit;
  if (actionCode.includes('delete') || actionCode.includes('eliminar')) return actionIcons.delete;
  if (actionCode.includes('manage') || actionCode.includes('gestionar')) return actionIcons.manage;
  return actionIcons.custom;
};

export function PermissionsForm({ selectedPermissions, onPermissionsChange }: PermissionsFormProps) {
  const [selectedView, setSelectedView] = useState<string>("");
  const [filterText, setFilterText] = useState(""); 
  const [modulos, setModulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    rolesService.listModulosConPermisos().then(data => {
      setModulos(data);
      setLoading(false);
    });
  }, []);

  const systemViews = (modulos || []).map((modulo: any) => ({
    id: modulo.id,
    displayName: modulo.nombre,
    descripcion: modulo.descripcion || '',
    codigo: String(modulo.id),
    nombre: modulo.nombre,
    acciones: modulo.gen_modulo_permisos.map((p: any) => ({
      id: p.id,
      codigo: p.code,
      nombre: p.nombre,
      descripcion: p.descripcion || ''
    }))
  }));

  useEffect(() => {
    const normalizedPermissions = selectedPermissions.map(permission => ({
      ...permission,
      actions: permission.actions || []
    }));
    
    const hasUndefinedActions = selectedPermissions.some(p => !p.actions);
    if (hasUndefinedActions) {
      onPermissionsChange(normalizedPermissions);
    }
  }, [selectedPermissions, onPermissionsChange]);

  const addView = () => {
    if (!selectedView) return;

    const view = systemViews.find(v => v.codigo === selectedView);
    if (!view) return;

    const existingIndex = selectedPermissions.findIndex(p => p.viewId === selectedView);
    if (existingIndex >= 0) return;

    const newPermission = {
      viewId: selectedView,
      viewName: view.nombre,
      actions: []
    };

    onPermissionsChange([...selectedPermissions, newPermission]);
    setSelectedView("");
  };

  const removeView = (viewId: string) => {
    onPermissionsChange(selectedPermissions.filter(p => p.viewId !== viewId));
  };

  const toggleAction = (viewId: string, actionCode: string) => {
    const updatedPermissions = selectedPermissions.map(permission => {
      if (String(permission.viewId) === String(viewId)) {
        const currentActions = permission.actions || [];
        const actions = currentActions.includes(actionCode)
          ? currentActions.filter(a => a !== actionCode)
          : [...currentActions, actionCode];
        
        return { ...permission, actions };
      }
      return permission;
    });

    onPermissionsChange(updatedPermissions);
  };

  const filteredViews = systemViews.filter(view => 
    !selectedPermissions.some(p => String(p.viewId) === String(view.codigo))
  );

  const filteredPermissions = selectedPermissions.filter(permission =>
    permission.viewName?.toLowerCase()?.includes(filterText.toLowerCase()) || false
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold text-center">Gestiona los Permisos</h3>
        <p className="text-center text-cyan-50 text-sm mt-1">
          Formularios que se le habilitaran a los usuarios con este rol
        </p>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nombre de la Vista
            </label>
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="bg-yellow-50 border-yellow-200">
                <SelectValue placeholder="Seleccionar vista..." />
              </SelectTrigger>
              <SelectContent>
                {filteredViews.map((view) => (
                  <SelectItem key={view.codigo} value={view.codigo}>
                    {view.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={addView}
            disabled={!selectedView}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6"
          >
            Agregar Vista
          </Button>
        </div>
      </div>

      {selectedPermissions.length > 0 && (
        <div className="p-2">
          <Input
            placeholder="Filtrar vistas..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {filteredPermissions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-cyan-100 border-b">
            <div className="grid grid-cols-8 gap-2 p-3 font-medium text-gray-700">
              <div className="col-span-4">Nombre De La Vista</div>
              <div className="col-span-3 text-center">Acciones Asociadas</div>
              <div className="col-span-1 text-center">Eliminar</div>
            </div>
          </div>

          <div className="divide-y">
            {filteredPermissions.map((permission) => {
              const view = systemViews.find(v => String(v.codigo) === String(permission.viewId));
              if (!view) return null;

              const allActionCodes = view.acciones.map(a => a.codigo);
              const areAllSelected = allActionCodes.length > 0 && allActionCodes.every(code => permission.actions.includes(code));

              return (
                <div key={permission.viewId} className="bg-white hover:bg-gray-50">
                  <div className="grid grid-cols-8 gap-2 p-3 items-center">
                    <div className="col-span-4">
                      <div className="bg-yellow-50 p-2 rounded border">
                        <span className="text-sm font-medium">{permission.viewName}</span>
                      </div>
                    </div>

                    <div className="col-span-3 text-center">
                      <MultiSelect
                        options={view.acciones.map((a) => ({
                          id: a.id, // Usar el ID numérico del permiso
                          value: a.codigo, // Usar el 'code' como valor para la selección interna
                          label: a.nombre, // Mostrar el nombre amigable
                          name: a.nombre,
                          description: a.description
                        })) as Option[]} 
                        selected={permission.actions.map((actionCode: string) => {
                          const foundAction = view.acciones.find(act => act.codigo === actionCode);
                          return foundAction ? foundAction.id : -1; // Mapear el 'code' a 'id'
                        }).filter(id => id !== -1)}
                        onSelectionChange={(selectedIds: number[]) => {
                          const actions = selectedIds.map(id => {
                            const found = view.acciones.find(act => act.id === id);
                            return found ? found.codigo : undefined; // Mapear 'id' de vuelta a 'code'
                          }).filter(Boolean) as string[];
                          const updatedPermissions = selectedPermissions.map(p =>
                            p.viewId === permission.viewId ? { ...p, actions } : p
                          );
                          onPermissionsChange(updatedPermissions);
                        }}
                        placeholder="Seleccionar acciones..."
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id={`select-all-${permission.viewId}`}
                          checked={areAllSelected}
                          onCheckedChange={(checked) => {
                            const newPermissions = [...selectedPermissions];
                            if (checked) {
                              newPermissions[filteredPermissions.findIndex(p => p.viewId === permission.viewId)] = { ...newPermissions[filteredPermissions.findIndex(p => p.viewId === permission.viewId)], actions: allActionCodes };
                            } else {
                              newPermissions[filteredPermissions.findIndex(p => p.viewId === permission.viewId)] = { ...newPermissions[filteredPermissions.findIndex(p => p.viewId === permission.viewId)], actions: [] };
                            }
                            onPermissionsChange(newPermissions);
                          }}
                        />
                        <Label htmlFor={`select-all-${permission.viewId}`} className="text-sm font-medium">
                          Seleccionar todas las acciones
                        </Label>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeView(permission.viewId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPermissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p>No hay vistas agregadas</p>
          <p className="text-sm">Selecciona una vista arriba para comenzar</p>
        </div>
      )}

      {selectedPermissions.length > 0 && (
        <div className="bg-cyan-50 p-4 rounded-lg">
          <h4 className="font-medium text-cyan-900 mb-2">Resumen de Permisos</h4>
          <div className="text-sm text-cyan-700">
            <span className="font-medium">{selectedPermissions.length}</span> vistas seleccionadas con{' '}
            <span className="font-medium">
              {selectedPermissions.reduce((total, p) => total + (p.actions?.length || 0), 0)}
            </span> acciones habilitadas
          </div>
        </div>
      )}
    </div>
  );
}