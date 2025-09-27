import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuloPermiso, CreateModuloPermisoData, UpdateModuloPermisoData } from '@/services/modulosService';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';

const permisoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  code: z.string().min(1, 'El código es requerido'),
});

type PermisoFormData = z.infer<typeof permisoSchema>;

interface PermisoFormProps {
  moduloId: number;
  permiso?: ModuloPermiso;
  onSubmit: (data: CreateModuloPermisoData | UpdateModuloPermisoData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PermisoForm: React.FC<PermisoFormProps> = ({
  moduloId,
  permiso,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { addAction } = useRegisterView('Modulos', 'formulario-permiso', 'Formulario de Permiso');

  React.useEffect(() => {
    addAction('guardar', 'Guardar Permiso');
    addAction('cancelar', 'Cancelar');
  }, [addAction]);

  const form = useForm<PermisoFormData>({
    resolver: zodResolver(permisoSchema),
    defaultValues: {
      nombre: permiso?.nombre || '',
      descripcion: permiso?.descripcion || '',
      code: permiso?.code || '',
    },
  });

  const handleSubmit = (data: PermisoFormData) => {
    if (permiso) {
      // Actualizar permiso existente
      onSubmit(data);
    } else {
      // Crear nuevo permiso
      onSubmit({
        ...data,
        modulo_id: moduloId,
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {permiso ? 'Editar Permiso' : 'Agregar Nuevo Permiso'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ingrese el nombre del permiso"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ingrese el código del permiso (ej: usuarios_view)"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ingrese una descripción del permiso (opcional)"
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Can action="accion-cancelar">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </Can>
              
              <Can action="accion-guardar">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : permiso ? 'Actualizar' : 'Crear'}
                </Button>
              </Can>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
