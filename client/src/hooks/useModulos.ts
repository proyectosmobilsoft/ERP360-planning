import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulosService, Modulo, ModuloConPermisos, CreateModuloData, UpdateModuloData, CreateModuloPermisoData, UpdateModuloPermisoData } from '@/services/modulosService';
import { useLoading } from '@/contexts/LoadingContext';
import { useToast } from '@/hooks/use-toast';

export const useModulos = () => {
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();

  const modulosQuery = useQuery({
    queryKey: ['modulos'],
    queryFn: modulosService.getModulos,
  });

  const modulosConPermisosQuery = useQuery({
    queryKey: ['modulos-con-permisos'],
    queryFn: modulosService.getModulosConPermisos,
  });

  const createModuloMutation = useMutation({
    mutationFn: async (data: CreateModuloData) => {
      startLoading();
      try {
        return await modulosService.createModulo(data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Módulo creado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al crear el módulo',
        variant: 'destructive',
      });
    },
  });

  const updateModuloMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateModuloData }) => {
      startLoading();
      try {
        return await modulosService.updateModulo(id, data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Módulo actualizado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al actualizar el módulo',
        variant: 'destructive',
      });
    },
  });

  const activateModuloMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.activateModulo(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Módulo activado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al activar el módulo',
        variant: 'destructive',
      });
    },
  });

  const deactivateModuloMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.deactivateModulo(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Módulo desactivado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al desactivar el módulo',
        variant: 'destructive',
      });
    },
  });

  const deleteModuloMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.deleteModulo(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Módulo eliminado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al eliminar el módulo',
        variant: 'destructive',
      });
    },
  });

  const createModuloPermisoMutation = useMutation({
    mutationFn: async (data: CreateModuloPermisoData) => {
      startLoading();
      try {
        return await modulosService.createModuloPermiso(data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Permiso creado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al crear el permiso',
        variant: 'destructive',
      });
    },
  });

  const updateModuloPermisoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateModuloPermisoData }) => {
      startLoading();
      try {
        return await modulosService.updateModuloPermiso(id, data);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Permiso actualizado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al actualizar el permiso',
        variant: 'destructive',
      });
    },
  });

  const deleteModuloPermisoMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await modulosService.deleteModuloPermiso(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modulos-con-permisos'] });
      toast({
        title: '✅ Éxito',
        description: 'Permiso eliminado correctamente',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Error al eliminar el permiso',
        variant: 'destructive',
      });
    },
  });

  return {
    // Queries
    modulos: modulosQuery.data || [],
    modulosConPermisos: modulosConPermisosQuery.data || [],
    isLoading: modulosQuery.isLoading || modulosConPermisosQuery.isLoading,
    isError: modulosQuery.isError || modulosConPermisosQuery.isError,
    refetch: () => {
      modulosQuery.refetch();
      modulosConPermisosQuery.refetch();
    },

    // Mutations
    createModulo: createModuloMutation.mutate,
    updateModulo: updateModuloMutation.mutate,
    activateModulo: activateModuloMutation.mutate,
    deactivateModulo: deactivateModuloMutation.mutate,
    deleteModulo: deleteModuloMutation.mutate,
    createModuloPermiso: createModuloPermisoMutation.mutate,
    updateModuloPermiso: updateModuloPermisoMutation.mutate,
    deleteModuloPermiso: deleteModuloPermisoMutation.mutate,

    // Mutation states
    isCreating: createModuloMutation.isPending,
    isUpdating: updateModuloMutation.isPending,
    isActivating: activateModuloMutation.isPending,
    isDeactivating: deactivateModuloMutation.isPending,
    isDeleting: deleteModuloMutation.isPending,
    isCreatingPermiso: createModuloPermisoMutation.isPending,
    isUpdatingPermiso: updateModuloPermisoMutation.isPending,
    isDeletingPermiso: deleteModuloPermisoMutation.isPending,
  };
};
