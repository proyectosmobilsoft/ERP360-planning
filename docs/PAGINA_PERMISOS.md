# Página de Gestión de Permisos

## Descripción

La página de **Gestión de Permisos** es una nueva funcionalidad que permite administrar los módulos del sistema y sus permisos asociados. Esta página está ubicada en el menú de **Seguridad** y proporciona una interfaz completa para gestionar la estructura de permisos del sistema.

## Funcionalidades

### 1. Gestión de Módulos

- **Listado de Módulos**: Muestra todos los módulos del sistema con su estado actual
- **Crear Módulo**: Permite crear nuevos módulos del sistema
- **Editar Módulo**: Permite modificar módulos existentes
- **Activar/Desactivar**: Controla la visibilidad de los módulos en el sistema
- **Eliminar**: Solo permite eliminar módulos inactivos

### 2. Gestión de Permisos

- **Ver Permisos**: Al hacer clic en el botón de escudo (Shield) se muestra la tabla de permisos del módulo
- **Agregar Permiso**: Permite crear nuevos permisos para un módulo específico
- **Editar Permiso**: Permite modificar permisos existentes
- **Eliminar Permiso**: Permite eliminar permisos del sistema

### 3. Características Técnicas

- **Filtros**: Búsqueda por nombre/descripción y filtro por estado
- **Confirmaciones**: Alertas de confirmación para todas las acciones críticas
- **Validaciones**: Formularios con validación de campos requeridos
- **Permisos**: Control de acceso basado en el sistema de permisos existente

## Estructura de la Base de Datos

### Tabla `gen_modulos`

```sql
CREATE TABLE gen_modulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `gen_modulo_permisos`

```sql
CREATE TABLE gen_modulo_permisos (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL REFERENCES gen_modulos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    code VARCHAR(255) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Archivos Creados

### 1. Servicios
- `client/src/services/modulosService.ts` - Servicio para operaciones CRUD de módulos y permisos

### 2. Hooks
- `client/src/hooks/useModulos.ts` - Hook personalizado con React Query para gestión de estado

### 3. Componentes
- `client/src/components/modulos/ModuloForm.tsx` - Formulario para crear/editar módulos
- `client/src/components/modulos/PermisoForm.tsx` - Formulario para crear/editar permisos

### 4. Páginas
- `client/src/pages/seguridad/PermisosPage.tsx` - Página principal de gestión de permisos

### 5. Migración
- `migrations/create_modulos_tables.sql` - Script SQL para crear las tablas necesarias

## Rutas Configuradas

- `/permisos` - Ruta principal
- `/seguridad/permisos` - Ruta alternativa en el menú de seguridad

## Códigos de Acción Registrados

La página registra automáticamente los siguientes códigos de acción:

### Para Módulos:
- `accion-crear` - Crear Módulo
- `accion-editar` - Editar Módulo
- `accion-activar` - Activar Módulo
- `accion-inactivar` - Inactivar Módulo
- `accion-eliminar` - Eliminar Módulo

### Para Permisos:
- `accion-agregar-permiso` - Agregar Permiso
- `accion-editar-permiso` - Editar Permiso
- `accion-eliminar-permiso` - Eliminar Permiso

## Instalación

### 1. Ejecutar Migración

```bash
# Ejecutar el script SQL en tu base de datos Supabase
psql -h [HOST] -U [USER] -d [DATABASE] -f migrations/create_modulos_tables.sql
```

### 2. Verificar Rutas

La página ya está configurada en `App.tsx` y el menú ya está actualizado en `DynamicSidebar.tsx`.

## Uso

### 1. Acceder a la Página

1. Navegar a **Seguridad** → **Permisos** en el menú lateral
2. O ir directamente a `/seguridad/permisos`

### 2. Crear un Módulo

1. Hacer clic en **Crear Módulo**
2. Completar el formulario con nombre y descripción
3. Hacer clic en **Crear**

### 3. Gestionar Permisos de un Módulo

1. En la lista de módulos, hacer clic en el botón de escudo (Shield)
2. Se mostrará la tabla de permisos del módulo
3. Hacer clic en **Agregar Permiso** para crear nuevos permisos
4. Completar el formulario con nombre, código y descripción

### 4. Activar/Desactivar Módulos

1. Usar los botones de Play (▶️) para activar o Pause (⏸️) para desactivar
2. Solo los módulos inactivos pueden ser eliminados

## Seguridad

- **RLS (Row Level Security)**: Habilitado en ambas tablas
- **Políticas**: Configuradas para permitir operaciones según el estado del registro
- **Validaciones**: Formularios con validación de campos requeridos
- **Confirmaciones**: Alertas para todas las acciones críticas

## Notas Importantes

1. **Eliminación en Cascada**: Al eliminar un módulo, se eliminan automáticamente todos sus permisos asociados
2. **Códigos Únicos**: Los códigos de permisos deben ser únicos en todo el sistema
3. **Estado Activo**: Solo los módulos activos son visibles en el sistema
4. **Permisos del Sistema**: La página respeta el sistema de permisos existente para controlar el acceso

## Personalización

### Agregar Nuevos Tipos de Permisos

Para agregar nuevos tipos de permisos, modificar el archivo de migración `create_modulos_tables.sql` y agregar las inserciones correspondientes.

### Modificar Validaciones

Las validaciones de los formularios se pueden modificar en los archivos `ModuloForm.tsx` y `PermisoForm.tsx` ajustando los esquemas de Zod.

### Cambiar Estilos

Los estilos se pueden personalizar modificando las clases de Tailwind CSS en los componentes correspondientes.
