import { obtenerEmpresaPorId } from '@/services/empresasService';

export interface Empresa {
  id: number;
  nombre: string;
  razonSocial: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  representanteLegal: string;
  cargoRepresentante: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Guarda la empresa seleccionada consultando primero la base de datos
 */
export const guardarEmpresaSeleccionadaConConsulta = async (empresaId: number): Promise<boolean> => {
  try {
    console.log('=== INICIO: Guardar empresa y datos de autenticación ===');
    console.log('Consultando empresa completa con ID:', empresaId);
    
    // Consultar información completa de la empresa
    const empresaCompleta = await obtenerEmpresaPorId(empresaId);
    
    if (!empresaCompleta) {
      console.error('No se pudo obtener información de la empresa con ID:', empresaId);
      return false;
    }

    console.log('Empresa completa obtenida:', empresaCompleta);
    
    // Guardar empresa Y datos de autenticación
    const resultado = guardarEmpresaSeleccionada(empresaCompleta);
    
    if (resultado) {
      console.log('✅ Empresa y datos de autenticación guardados exitosamente');
      
      // Verificar que todo se guardó correctamente
      const userData = localStorage.getItem('userData');
      const authToken = localStorage.getItem('authToken');
      const empresaData = localStorage.getItem('empresaData');
      
      console.log('📊 Verificación final:');
      console.log('- userData guardado:', !!userData);
      console.log('- authToken guardado:', !!authToken);
      console.log('- empresaData guardado:', !!empresaData);
      
      console.log('=== FIN: Guardar empresa y datos de autenticación ===');
      return true;
    } else {
      console.error('Error al guardar empresa y datos de autenticación');
      return false;
    }
  } catch (error) {
    console.error('Error en guardarEmpresaSeleccionadaConConsulta:', error);
    return false;
  }
};

/**
 * Ejemplo de uso:
 * 
 * // En tu componente de selección de empresa:
 * import { guardarEmpresaSeleccionadaConConsulta } from '@/utils/empresaUtils';
 * 
 * const handleEmpresaClick = async (empresaId: number) => {
 *   const resultado = await guardarEmpresaSeleccionadaConConsulta(empresaId);
 *   if (resultado) {
 *     console.log('Empresa seleccionada y guardada correctamente');
 *     // Redirigir o hacer algo más
 *   }
 * };
 */

/**
 * Función para guardar la empresa seleccionada en localStorage
 */
export const guardarEmpresaSeleccionada = (empresa: Empresa): boolean => {
  try {
    console.log('=== INICIO: guardarEmpresaSeleccionada ===');
    
    // Verificar estado ANTES de guardar
    const beforeUserData = localStorage.getItem('userData');
    const beforeAuthToken = localStorage.getItem('authToken');
    const beforeEmpresaData = localStorage.getItem('empresaData');
    
    console.log('📊 Estado ANTES de guardar:');
    console.log('- userData existe:', !!beforeUserData);
    console.log('- authToken existe:', !!beforeAuthToken);
    console.log('- empresaData existe:', !!beforeEmpresaData);
    
    console.log('Guardando empresa en empresaData:', empresa);
    
    // Guardar empresaData
    localStorage.setItem('empresaData', JSON.stringify(empresa));
    
    // NO tocar userData ni authToken existentes - usar los datos reales del usuario autenticado
    console.log('Empresa guardada exitosamente en empresaData');
    console.log('Manteniendo datos de autenticación existentes sin modificar');
    
    // Disparar evento para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('empresaSelected', { detail: empresa }));
    
    console.log('=== FIN: guardarEmpresaSeleccionada ===');
    return true;
  } catch (error) {
    console.error('Error al guardar empresa en localStorage:', error);
    return false;
  }
};

/**
 * Función para obtener la empresa seleccionada desde localStorage
 */
export const obtenerEmpresaSeleccionada = (): Empresa | null => {
  try {
    const empresaDataString = localStorage.getItem('empresaData');
    if (empresaDataString) {
      const empresa = JSON.parse(empresaDataString);
      console.log('Empresa obtenida desde empresaData:', empresa);
      return empresa;
    }
    console.log('No se encontró empresaData en localStorage');
    return null;
  } catch (error) {
    console.error('Error al obtener empresa desde localStorage:', error);
    return null;
  }
};

/**
 * Función para verificar si hay una empresa seleccionada
 */
export const hayEmpresaSeleccionada = (): boolean => {
  try {
    const empresaData = localStorage.getItem('empresaData');
    return empresaData !== null;
  } catch (error) {
    console.error('Error al verificar empresa seleccionada:', error);
    return false;
  }
};

/**
 * Función para limpiar la empresa seleccionada del localStorage
 */
export const limpiarEmpresaSeleccionada = (): void => {
  try {
    console.log('Limpiando empresaData del localStorage');
    localStorage.removeItem('empresaData');
    console.log('EmpresaData eliminada del localStorage');
  } catch (error) {
    console.error('Error al limpiar empresa del localStorage:', error);
  }
};

/**
 * Función para debuggear el estado de localStorage
 */
export const debugLocalStorage = () => {
  console.log('=== DEBUG LOCALSTORAGE ===');
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  const empresaData = localStorage.getItem('empresaData');
  
  console.log('userData:', userData ? JSON.parse(userData) : null);
  console.log('authToken:', authToken);
  console.log('empresaData:', empresaData ? JSON.parse(empresaData) : null);
  console.log('========================');
};

/**
 * Función para obtener información completa del usuario con empresa
 */
export const obtenerUsuarioConEmpresa = () => {
  try {
    const userDataString = localStorage.getItem('userData');
    const userData = userDataString ? JSON.parse(userDataString) : {};
    
    return {
      ...userData,
      empresa: userData.empresa || obtenerEmpresaSeleccionada()
    };
  } catch (error) {
    console.error('Error al obtener usuario con empresa:', error);
    return null;
  }
}; 