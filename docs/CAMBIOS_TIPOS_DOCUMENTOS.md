# Cambios en el Sistema de Tipos de Documentos

## Resumen de Cambios

Se han realizado modificaciones importantes en el sistema de gestión de tipos de documentos para mejorar la flexibilidad y la gestión de documentos requeridos.

## Cambios Implementados

### 1. Reordenamiento de Menús
- **Tipos de Documentos** ahora aparece **ARRIBA** de **Tipos de Cargos**
- Esto refleja la jerarquía lógica: primero se definen los tipos de documentos, luego se configuran para cada cargo

### 2. Eliminación del Campo "Requerido" de Tipos de Documentos
- Se eliminó el campo `requerido` de la tabla `tipos_documentos`
- Los tipos de documentos ya no tienen un estado "requerido" por defecto
- Esto permite mayor flexibilidad en la configuración

### 3. Nueva Lógica de Documentos Requeridos
- Los documentos ahora se marcan como **requeridos** al momento de asociarlos a un **tipo de cargo**
- Al configurar documentos para un cargo, aparece un checkbox para definir si es requerido
- La configuración se guarda en la tabla de relación `tipos_candidatos_documentos`

## Estructura de Base de Datos

### Antes
```sql
tipos_documentos:
- id
- nombre
- descripcion
- requerido (BOOLEAN) -- ELIMINADO
- lleva_fecha_vigencia
- fecha_vigencia
- activo
- created_at
- updated_at
```

### Después
```sql
tipos_documentos:
- id
- nombre
- descripcion
- lleva_fecha_vigencia
- fecha_vigencia
- activo
- created_at
- updated_at

tipos_candidatos_documentos:
- id
- tipo_candidato_id
- tipo_documento_id
- obligatorio (BOOLEAN) -- NUEVO CAMPO
- orden
- created_at
- updated_at
```

## Beneficios de los Cambios

1. **Mayor Flexibilidad**: Un documento puede ser requerido para un cargo pero no para otro
2. **Mejor Organización**: Los tipos de documentos se definen primero, luego se configuran por cargo
3. **Configuración Granular**: Cada tipo de cargo puede tener su propia configuración de documentos
4. **Mantenimiento Simplificado**: Los tipos de documentos son más simples y reutilizables

## Archivos Modificados

- `client/src/types/maestro.ts` - Tipos de TypeScript
- `client/src/pages/maestro/TiposDocumentosPage.tsx` - Página de tipos de documentos
- `client/src/pages/maestro/TiposCandidatosPage.tsx` - Página de tipos de candidatos
- `client/src/services/tiposDocumentosService.ts` - Servicio de tipos de documentos
- `client/src/hooks/useTiposDocumentos.ts` - Hook de tipos de documentos

## Migración de Base de Datos

Se incluye el archivo de migración `migrations/remove_requerido_from_tipos_documentos.sql` que debe ejecutarse para actualizar la base de datos.

## Notas Importantes

- Los documentos existentes que tenían `requerido = true` necesitarán ser reconfigurados en los tipos de cargos correspondientes
- Se recomienda revisar todas las configuraciones de documentos por tipo de cargo después de aplicar la migración
- El sistema mantiene la compatibilidad hacia atrás para los datos existentes
