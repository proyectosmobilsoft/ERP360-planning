# 📋 Instrucciones para Configurar el Sistema de Logs Completo

## 🚀 Pasos para Configurar

### 1. Ejecutar las Migraciones SQL

Necesitas ejecutar las siguientes migraciones en orden:

#### A. Tabla de Logs de Solicitudes
1. Ve a **Supabase SQL Editor**
2. Copia y pega el contenido de `migrations/create_solicitudes_logs_table.sql`
3. Ejecuta la consulta

#### B. Tabla de Logs de Usuarios
1. Copia y pega el contenido de `migrations/create_usuarios_logs_table.sql`
2. Ejecuta la consulta

#### C. Tabla de Logs de Empresas
1. Copia y pega el contenido de `migrations/create_empresas_logs_table.sql`
2. Ejecuta la consulta

#### D. Columna Observaciones en Solicitudes
1. Copia y pega el contenido de `migrations/add_observacion_to_solicitudes.sql`
2. Ejecuta la consulta

### 2. Verificar las Tablas Creadas

Después de ejecutar todas las migraciones, verifica que las tablas se hayan creado correctamente:

```sql
-- Ejecutar el script de verificación completo
-- Copia y pega el contenido de scripts/verify_all_logs_tables.sql
```

## 🧪 Probar la Funcionalidad

### 1. Acceder a la Página de Logs

1. Inicia tu aplicación
2. Navega a **Seguridad → Logs del Sistema**
3. Verás todos los logs del sistema organizados por entidad

### 2. Probar Acciones con Logs Automáticos

El sistema ahora registra automáticamente logs para las siguientes acciones:

#### **Solicitudes:**
- ✅ **Crear solicitud** → Log de creación
- ✅ **Asignar analista** → Log de asignación automática
- ✅ **Cambiar estado** → Log de cambio de estado
- ✅ **Put Stand By** → Log específico de Stand By
- ✅ **Reactivar** → Log de reactivación
- ✅ **Contactar** → Log de contacto
- ✅ **Aprobar** → Log de aprobación
- ✅ **Rechazar** → Log de rechazo
- ✅ **Editar** → Log de edición
- ✅ **Eliminar** → Log de eliminación
- ✅ **Asignar prioridad** → Log de prioridad
- ✅ **Actualizar observaciones** → Log de observaciones

#### **Usuarios:**
- ✅ **Crear usuario** → Log de creación
- ✅ **Editar usuario** → Log de edición
- ✅ **Eliminar usuario** → Log de eliminación
- ✅ **Activar/Desactivar** → Log de cambio de estado
- ✅ **Cambiar rol** → Log de cambio de rol

#### **Empresas:**
- ✅ **Crear empresa** → Log de creación
- ✅ **Editar empresa** → Log de edición
- ✅ **Eliminar empresa** → Log de eliminación
- ✅ **Asignar analista** → Log de asignación
- ✅ **Cambiar estado** → Log de cambio de estado

### 3. Verificar Logs en la Base de Datos

Después de realizar acciones, verifica que se hayan creado los logs:

```sql
-- Ver logs de solicitudes
SELECT * FROM hum_solicitudes_logs ORDER BY fecha_accion DESC LIMIT 10;

-- Ver logs de usuarios
SELECT * FROM gen_usuarios_logs ORDER BY fecha_accion DESC LIMIT 10;

-- Ver logs de empresas
SELECT * FROM gen_empresas_logs ORDER BY fecha_accion DESC LIMIT 10;
```

## 🔍 Solución de Problemas

### Error: "Failed to resolve import @/lib/supabase"

**Solución:** Ya está corregido. Los archivos usan la importación correcta:
```typescript
import { supabase } from './supabaseClient';
```

### Error: "column gen_usuarios_1.nombre does not exist"

**Solución:** Ya está corregido. La tabla `gen_usuarios` usa los campos:
- `primer_nombre` en lugar de `nombre`
- `primer_apellido` en lugar de `apellido`
- `username` para el nombre de usuario
- `email` para el correo electrónico

### Error: "Could not find the 'observaciones' column of 'hum_solicitudes' in the schema cache"

**Solución:** La columna `observaciones` no existe en la tabla `hum_solicitudes`. Necesitas ejecutar la migración para agregarla.

#### Opción A: Ejecutar la Migración Automática
1. Ve a **Supabase SQL Editor**
2. Copia y pega el contenido de `migrations/add_observacion_to_solicitudes.sql`
3. Ejecuta la consulta

#### Opción B: Verificar y Agregar Manualmente
1. Ejecuta el script `scripts/verify_hum_solicitudes_structure.sql` para ver la estructura actual
2. Si la columna `observaciones` no existe, ejecuta:
   ```sql
   ALTER TABLE hum_solicitudes 
   ADD COLUMN observaciones TEXT NULL;
   
   COMMENT ON COLUMN hum_solicitudes.observaciones IS 'Observaciones sobre el estado actual de la solicitud';
   ```

### Error: "Table does not exist"

**Solución:** Ejecuta las migraciones SQL en el orden especificado arriba.

### Error: "Permission denied"

**Solución:** Verifica que tu usuario de Supabase tenga permisos para:
- Crear tablas
- Insertar datos
- Leer datos

## 📊 Verificar Datos de Prueba

### Crear Datos de Prueba (si es necesario)

```sql
-- Insertar un usuario de prueba si no existe
INSERT INTO gen_usuarios (
    id, 
    username, 
    email, 
    primer_nombre, 
    primer_apellido, 
    activo, 
    rol_id,
    created_at,
    updated_at
) VALUES (
    1, 
    'admin_test', 
    'admin@test.com', 
    'Administrador', 
    'Prueba', 
    true, 
    1,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar una solicitud de prueba si no existe
INSERT INTO hum_solicitudes (id, estado, created_at, updated_at) 
VALUES (1, 'PENDIENTE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

### Script de Verificación Completo

Ejecuta el script `scripts/verify_all_logs_tables.sql` en Supabase SQL Editor para:
1. Verificar la estructura de todas las tablas de logs
2. Contar el total de logs en cada tabla
3. Mostrar logs de ejemplo
4. Verificar índices y restricciones

## 🎯 Funcionalidades del Sistema de Logs

### **Logs Automáticos:**
- **Sin intervención manual** - Se crean automáticamente
- **Trazabilidad completa** - Registro de quién, qué, cuándo y por qué
- **Historial detallado** - Estados anteriores y nuevos
- **Observaciones** - Contexto adicional de cada acción

### **Filtros y Búsquedas:**
- **Por entidad** - Solicitudes, usuarios, empresas
- **Por acción** - Tipo de operación realizada
- **Por usuario** - Quién realizó la acción
- **Por fecha** - Rango de fechas específico
- **Por estado** - Cambios de estado específicos

### **Información Registrada:**
- **Usuario que realizó la acción**
- **Entidad afectada** (ID y detalles)
- **Tipo de acción** (crear, editar, eliminar, etc.)
- **Estado anterior y nuevo** (cuando aplica)
- **Observaciones y detalles**
- **Fecha y hora exacta**

## 🎯 Próximos Pasos

Una vez que las migraciones estén ejecutadas y las pruebas funcionen correctamente:

1. **Integrar logs en componentes existentes** (ya implementado)
2. **Configurar permisos** si es necesario
3. **Personalizar filtros** según necesidades específicas
4. **Implementar notificaciones** para acciones críticas
5. **Crear reportes** basados en los logs

## 📞 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador para errores
2. Verifica los logs de Supabase
3. Ejecuta las pruebas de conexión
4. Verifica que todas las tablas existan y tengan la estructura correcta
5. Ejecuta el script de verificación completo

---

**Nota:** El sistema de logs está completamente automatizado. Cada acción importante del sistema se registra automáticamente sin necesidad de intervención manual.
