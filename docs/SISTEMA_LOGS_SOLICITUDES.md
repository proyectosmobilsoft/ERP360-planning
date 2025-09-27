# 📋 Sistema de Logs de Solicitudes

## 🎯 Descripción General

El sistema de logs de solicitudes es una funcionalidad que registra automáticamente todas las acciones realizadas en las solicitudes del sistema. Cada acción se almacena con información detallada incluyendo el usuario que la realizó, la fecha y hora, y observaciones específicas.

## 🗄️ Estructura de la Base de Datos

### Tabla: `hum_solicitudes_logs`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL | Identificador único del log |
| `solicitud_id` | INTEGER | ID de la solicitud sobre la que se realizó la acción |
| `usuario_id` | INTEGER | ID del usuario que realizó la acción |
| `accion` | VARCHAR(100) | Tipo de acción realizada |
| `estado_anterior` | VARCHAR(50) | Estado anterior de la solicitud (si aplica) |
| `estado_nuevo` | VARCHAR(50) | Nuevo estado de la solicitud (si aplica) |
| `observacion` | TEXT | Descripción detallada de la acción |
| `fecha_accion` | TIMESTAMP | Fecha y hora exacta de la acción |

### Índices de Rendimiento

- `idx_solicitudes_logs_solicitud_id` - Para consultas por solicitud
- `idx_solicitudes_logs_usuario_id` - Para consultas por usuario
- `idx_solicitudes_logs_fecha_accion` - Para consultas por fecha
- `idx_solicitudes_logs_accion` - Para consultas por tipo de acción

## 🔧 Acciones del Sistema

### Constantes de Acciones

```typescript
export const ACCIONES_SOLICITUDES = {
  CREAR: 'CREAR_SOLICITUD',
  CAMBIAR_ESTADO: 'CAMBIAR_ESTADO',
  ASIGNAR_ANALISTA: 'ASIGNAR_ANALISTA',
  EDITAR: 'EDITAR_SOLICITUD',
  APROBAR: 'APROBAR_SOLICITUD',
  RECHAZAR: 'RECHAZAR_SOLICITUD',
  CONTACTAR: 'CONTACTAR_SOLICITUD',
  STAND_BY: 'STAND_BY_SOLICITUD',
  REACTIVAR: 'REACTIVAR_SOLICITUD',
  ELIMINAR: 'ELIMINAR_SOLICITUD'
};
```

## 🚀 Implementación

### 1. Servicio de Logs

El servicio `solicitudesLogsService` proporciona métodos para:

- **Crear logs**: `crearLog(params)`
- **Consultar por solicitud**: `getLogsBySolicitud(solicitudId)`
- **Consultar por usuario**: `getLogsByUsuario(usuarioId)`
- **Consultar por acción**: `getLogsByAccion(accion)`
- **Consultar por rango de fechas**: `getLogsByDateRange(fechaInicio, fechaFin)`
- **Consultar todos con paginación**: `getAllLogs(page, limit)`

### 2. Hook Personalizado

El hook `useSolicitudesLogs` proporciona funciones específicas para cada tipo de acción:

```typescript
const {
  logCrearSolicitud,
  logCambiarEstado,
  logAsignarAnalista,
  logEditarSolicitud,
  logAprobarSolicitud,
  logRechazarSolicitud,
  logContactarSolicitud,
  logStandBySolicitud,
  logReactivarSolicitud,
  logEliminarSolicitud
} = useSolicitudesLogs();
```

### 3. Componente de Visualización

El componente `SolicitudLogs` muestra el historial completo de acciones de una solicitud con:

- Iconos específicos para cada tipo de acción
- Badges con colores diferenciados
- Información del usuario y fecha
- Estados anteriores y nuevos
- Observaciones detalladas

## 📝 Ejemplos de Uso

### Crear Log de Creación de Solicitud

```typescript
const { logCrearSolicitud } = useSolicitudesLogs();

// Al crear una nueva solicitud
await logCrearSolicitud(solicitudId, 'Solicitud creada con plantilla personalizada');
```

### Crear Log de Cambio de Estado

```typescript
const { logCambiarEstado } = useSolicitudesLogs();

// Al cambiar el estado de una solicitud
await logCambiarEstado(
  solicitudId, 
  'PENDIENTE', 
  'ASIGNADO', 
  'Estado cambiado por asignación automática de analista'
);
```

### Crear Log de Stand By

```typescript
const { logStandBySolicitud } = useSolicitudesLogs();

// Al poner una solicitud en Stand By
await logStandBySolicitud(
  solicitudId, 
  'ASIGNADO', 
  'Cliente solicitó pausar temporalmente el proceso'
);
```

### Crear Log de Reactivación

```typescript
const { logReactivarSolicitud } = useSolicitudesLogs();

// Al reactivar una solicitud
await logReactivarSolicitud(
  solicitudId, 
  'STAND BY', 
  'ASIGNADO', 
  'Cliente confirmó continuar con el proceso'
);
```

## 🔍 Consultas de Logs

### Obtener Historial de una Solicitud

```typescript
const logs = await solicitudesLogsService.getLogsBySolicitud(solicitudId);
```

### Obtener Acciones de un Usuario

```typescript
const logs = await solicitudesLogsService.getLogsByUsuario(usuarioId);
```

### Obtener Logs por Tipo de Acción

```typescript
const logs = await solicitudesLogsService.getLogsByAccion('CAMBIAR_ESTADO');
```

### Obtener Logs por Rango de Fechas

```typescript
const logs = await solicitudesLogsService.getLogsByDateRange(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
);
```

## 🎨 Características Visuales

### Iconos por Acción

- **Crear**: ➕ Verde
- **Cambiar Estado**: ⚠️ Azul
- **Asignar Analista**: 👤 Púrpura
- **Editar**: ✏️ Naranja
- **Aprobar**: ✅ Verde
- **Rechazar**: ❌ Rojo
- **Contactar**: 📞 Azul
- **Stand By**: ⏸️ Gris
- **Reactivar**: ▶️ Verde
- **Eliminar**: ❌ Rojo

### Variantes de Badges

- **default**: Verde (acciones positivas)
- **secondary**: Azul (acciones informativas)
- **outline**: Gris (acciones neutras)
- **destructive**: Rojo (acciones negativas)

## 🔒 Seguridad y Auditoría

### Características de Seguridad

- **Usuario obligatorio**: Cada log debe tener un usuario asociado
- **Timestamps automáticos**: Fechas se generan automáticamente
- **Integridad referencial**: Foreign keys con CASCADE DELETE
- **Validación de datos**: Campos requeridos validados

### Beneficios de Auditoría

- **Trazabilidad completa**: Historial detallado de cada solicitud
- **Responsabilidad**: Identificación clara del usuario que realizó cada acción
- **Compliance**: Cumplimiento de requisitos de auditoría
- **Debugging**: Facilita la resolución de problemas
- **Análisis**: Datos para mejorar procesos y identificar patrones

## 🚀 Próximos Pasos

### Funcionalidades Futuras

1. **Exportación de Logs**: Generar reportes en PDF/Excel
2. **Filtros Avanzados**: Búsqueda por múltiples criterios
3. **Notificaciones**: Alertas para acciones críticas
4. **Dashboard de Actividad**: Vista general de actividad del sistema
5. **Logs de Otros Módulos**: Extender a empresas, analistas, etc.

### Integración con Otros Sistemas

- **Sistema de Notificaciones**: Alertas en tiempo real
- **Reportes Automáticos**: Generación programada de reportes
- **API Externa**: Exposición de logs para sistemas externos
- **Backup Automático**: Respaldo automático de logs históricos

## 📚 Referencias

- **Migración SQL**: `migrations/create_solicitudes_logs_table.sql`
- **Servicio**: `client/src/services/solicitudesLogsService.ts`
- **Hook**: `client/src/hooks/useSolicitudesLogs.ts`
- **Componente**: `client/src/components/solicitudes/SolicitudLogs.tsx`
- **Constantes**: `client/src/services/solicitudesLogsService.ts` (ACCIONES_SOLICITUDES)

---

*Este sistema de logs proporciona una base sólida para la auditoría y trazabilidad de todas las acciones realizadas en las solicitudes del sistema.*
