import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modulo, CreateModuloData, UpdateModuloData } from '@/services/modulosService';
import { useRegisterView } from '@/hooks/useRegisterView';
import { Can } from '@/contexts/PermissionsContext';

const moduloSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
});

type ModuloFormData = z.infer<typeof moduloSchema>;

interface ModuloFormProps {
  modulo?: Modulo;
  onSubmit: (data: CreateModuloData | UpdateModuloData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ModuloForm: React.FC<ModuloFormProps> = ({
  modulo,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { addAction } = useRegisterView('Modulos', 'formulario', 'Formulario de Módulo');

  React.useEffect(() => {
    addAction('guardar', 'Guardar Módulo');
    addAction('cancelar', 'Cancelar');
  }, [addAction]);

  const form = useForm<ModuloFormData>({
    resolver: zodResolver(moduloSchema),
    defaultValues: {
      nombre: modulo?.nombre || '',
      descripcion: modulo?.descripcion || '',
    },
  });

  const handleSubmit = (data: ModuloFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {modulo ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
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
                      placeholder="Ingrese el nombre del módulo"
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
                      placeholder="Ingrese una descripción del módulo (opcional)"
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
                  {isLoading ? 'Guardando...' : modulo ? 'Actualizar' : 'Crear'}
                </Button>
              </Can>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
