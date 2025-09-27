
import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { api } from '@/services/api';

interface ApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  autoFetch?: boolean; // Option to control if fetch should happen automatically
}

const defaultOptions: ApiOptions = {
  showSuccessToast: false,
  showErrorToast: true,
  successMessage: "Operación realizada con éxito",
  errorMessage: "Error al realizar la operación",
  autoFetch: false, // By default, no automatic fetch
};

export function useApiData<T>(endpoint: string, initialData: T, options: ApiOptions = {}) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFetched, setIsFetched] = useState<boolean>(false); // To track if data has been fetched already

  const mergedOptions = { ...defaultOptions, ...options };

  const fetchData = useCallback(async () => {
    // If already fetched and autoFetch is disabled, don't fetch again
    if (isFetched && !mergedOptions.autoFetch) {
      return data;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<any>(endpoint);
      
      // Handle API responses that contain data in a nested structure
      let responseData;
      if (Array.isArray(response)) {
        responseData = response;
      } else if (response && typeof response === 'object') {
        if ('data' in response) {
          responseData = response.data;
        } else if ('filas' in response) {
          responseData = Array.isArray(response.filas) ? response.filas : [];
        } else {
          responseData = response;
        }
      } else {
        responseData = initialData; // Fallback to initial data if response is not as expected
      }

      setData(responseData as T);
      setIsFetched(true);
      
      if (mergedOptions.showSuccessToast) {
        toast.success(mergedOptions.successMessage);
      }
      
      return responseData;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (mergedOptions.showErrorToast) {
        toast.error(mergedOptions.errorMessage || error.message);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, mergedOptions, data, isFetched, initialData]);

  const createData = useCallback(async (newData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<T>(`${endpoint}/guardar`, newData);
      
      if (mergedOptions.showSuccessToast) {
        toast.success(mergedOptions.successMessage);
      }
      
      return response;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (mergedOptions.showErrorToast) {
        toast.error(mergedOptions.errorMessage || error.message);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, mergedOptions]);

  const updateData = useCallback(async (id: string | number, updatedData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<T>(`${endpoint}/editar`, updatedData);
      
      if (mergedOptions.showSuccessToast) {
        toast.success(mergedOptions.successMessage);
      }
      
      return response;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (mergedOptions.showErrorToast) {
        toast.error(mergedOptions.errorMessage || error.message);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, mergedOptions]);

  const deleteData = useCallback(async (id: string | number) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post(`${endpoint}/eliminar`, { id });
      
      if (mergedOptions.showSuccessToast) {
        toast.success(mergedOptions.successMessage);
      }
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (mergedOptions.showErrorToast) {
        toast.error(mergedOptions.errorMessage || error.message);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, mergedOptions]);

  return { 
    data, 
    setData, 
    isLoading, 
    error, 
    fetchData, 
    createData, 
    updateData, 
    deleteData,
    isFetched
  };
}
