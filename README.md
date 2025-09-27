# RH Compensamos - Sistema de Gestión de Recursos Humanos

## 📋 Descripción General

RH Compensamos es un sistema completo de gestión de recursos humanos que permite a empresas de servicios de RRHH gestionar candidatos, empresas clientes, órdenes de contratación y procesos de selección de manera eficiente y profesional.

## 🚀 Características Principales

### ✅ **Funcionalidades Core:**
- **Gestión de Candidatos**: Registro, seguimiento y documentación completa
- **Gestión de Empresas**: Clientes y prestadores de servicios
- **Órdenes de Contratación**: Proceso completo de selección
- **Sistema de Email**: Comunicación automatizada con plantillas
- **Recuperación de Contraseñas**: Sistema seguro con códigos de verificación
- **Configuraciones Globales**: Gestión de datos empresariales
- **Acerca de la Empresa**: Vista detallada de información empresarial

### 🎯 **Módulos Especializados:**
- **Autenticación Unificada**: Login para diferentes tipos de usuarios
- **Gestión de Permisos**: Sistema de roles y permisos granulares
- **Notificaciones**: Sistema de alertas y comunicaciones
- **Reportes**: Generación de informes y métricas
- **Documentos**: Gestión de archivos y documentación

## 🏗️ Arquitectura del Sistema

### **Frontend:**
- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **Tailwind CSS** para estilos
- **Shadcn/ui** para componentes
- **React Router** para navegación
- **React Query** para gestión de estado

### **Backend:**
- **Supabase** como backend-as-a-service
- **PostgreSQL** para base de datos
- **Edge Functions** para lógica de negocio
- **Row Level Security (RLS)** para seguridad
- **Storage** para archivos y documentos

## 📦 Instalación y Configuración

### **Prerrequisitos:**
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### **1. Clonar el Repositorio:**
```bash
git clone <repository-url>
cd rh-compensamos
```

### **2. Instalar Dependencias:**
```bash
npm install
```

### **3. Configurar Variables de Entorno:**
Crear archivo `.env.local` en la carpeta `client/`:

```env
VITE_SUPABASE_URL=https://vlmeifyldcgfmhppynir.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbWVpZnlsZGNnZm1ocHB5bmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODQwNDUsImV4cCI6MjA2OTA2MDA0NX0.8MtUi9I_evcJYvB3tXGCKsXDpUX7V13T_DDfBbRvvu8
```

### **4. Configurar Base de Datos:**
Ejecutar los scripts SQL en Supabase SQL Editor:

```sql
-- Crear tablas principales
-- Ver archivos: create_email_tables.sql, create_test_company.sql
```

### **5. Ejecutar el Proyecto:**
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

## 🗄️ Estructura de la Base de Datos

### **Tablas Principales:**
- **users** - Usuarios administradores del sistema
- **perfiles** - Roles y permisos del sistema
- **empresas** - Empresas clientes del sistema
- **candidatos** - Candidatos y aspirantes
- **clientes** - Clientes del sistema
- **analistas** - Analistas que procesan órdenes
- **ordenes** - Órdenes de contratación
- **tipos_candidatos** - Tipos de candidatos disponibles
- **documentos_tipo** - Tipos de documentos requeridos
- **candidatos_documentos** - Documentos subidos por candidatos

### **Tablas de Sistema:**
- **system_views** - Vistas del sistema
- **view_actions** - Acciones disponibles por vista
- **profile_view_permissions** - Permisos de vista por perfil
- **profile_action_permissions** - Permisos de acción por perfil
- **menu_nodes** - Nodos del menú
- **menu_permissions** - Permisos del menú
- **menu_actions** - Acciones del menú

### **Tablas de Seguimiento:**
- **ordenes_historial** - Historial de cambios de estado
- **notificaciones** - Notificaciones enviadas
- **alertas** - Alertas del sistema
- **metricas** - Métricas de rendimiento
- **password_reset_tokens** - Tokens de recuperación

## 📧 Sistema de Email

### **Configuración de Gmail:**

#### **Opción A: Sin Autenticación de Dos Factores**
1. Ve a tu cuenta de Google
2. Seguridad → Contraseñas de aplicaciones
3. Habilita "Acceso de aplicaciones menos seguras"
4. Usa tu contraseña normal de Gmail

#### **Opción B: Con Autenticación de Dos Factores (Recomendado)**
1. Ve a tu cuenta de Google
2. Seguridad → Verificación en dos pasos
3. Contraseñas de aplicación
4. Genera una nueva contraseña para "RH Compensamos"
5. Usa esta contraseña en lugar de tu contraseña normal

### **Tablas de Email:**
```sql
-- email_templates - Plantillas de email
-- gmail_templates - Plantillas específicas de Gmail
-- email_campaigns - Campañas de email
-- gmail_campaigns - Campañas específicas de Gmail
-- email_recipients - Destinatarios de email
-- campaign_recipient_selection - Selección de destinatarios
```

### **Edge Functions:**
- `supabase/functions/send-email/index.ts` - Función para enviar emails

## 🔐 Sistema de Recuperación de Contraseñas

### **Características:**
- ✅ **Generación de códigos** de 6 dígitos
- ✅ **Expiración automática** (30 minutos)
- ✅ **Verificación de códigos** en tiempo real
- ✅ **Cambio seguro de contraseña**
- ✅ **Interfaz moderna** y responsiva
- ✅ **Validaciones completas**

### **Flujo de Funcionamiento:**
1. **Usuario solicita recuperación** → `/recuperar-password`
2. **Ingresa email** → Sistema genera código de 6 dígitos
3. **Código se guarda en BD** → Con expiración de 30 minutos
4. **Email se envía** → Con el código de verificación
5. **Usuario ingresa código** → `/verificar-codigo`
6. **Sistema verifica código** → Valida que existe y no ha expirado
7. **Usuario cambia contraseña** → Nueva contraseña se hashea y guarda
8. **Código se marca como usado** → No se puede reutilizar

## 🏢 Configuraciones Globales

### **Funcionalidades:**
- **Visualización completa** de la información de la empresa seleccionada
- **Edición en tiempo real** de todos los campos de la empresa
- **Interfaz intuitiva** con formularios organizados por categorías
- **Validación de datos** y feedback visual
- **Guardado automático** con confirmación de cambios
- **Diseño responsivo** que funciona en todos los dispositivos

### **Información Gestionada:**
- **Información Básica**: Razón Social, NIT, Tipo de Documento, Régimen Tributario
- **Información de Contacto**: Teléfono, Email, Representante Legal, Dirección
- **Información del Sistema**: Fecha de Registro, Última Actualización, ID de Empresa

## 📊 Acerca de la Empresa

### **Información Mostrada:**
- **Información General**: Razón Social, Estado, Tipo de Empresa, NIT, Régimen Tributario
- **Información de Contacto**: Dirección, Ciudad, Departamento, Teléfono, Email, Representante Legal
- **Actividad Económica**: Código de Actividad, Descripción de Actividad
- **Información del Sistema**: Fecha de Registro, Última Actualización, ID de Empresa

### **Características del Diseño:**
- **Layout Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Cards Organizadas**: Información dividida en secciones lógicas
- **Badges de Estado**: Indicadores visuales para estado y tipo de empresa
- **Iconos Descriptivos**: Cada sección tiene su icono representativo
- **Colores Consistentes**: Usa la paleta de colores del sistema

## 🔒 Seguridad

### **Medidas Implementadas:**
- **Row Level Security (RLS)** habilitado
- **Autenticación JWT** con Supabase Auth
- **Permisos granulares** por perfil de usuario
- **Validación de datos** en frontend y backend
- **Manejo seguro de contraseñas** con hash
- **Códigos de verificación** con expiración
- **Logs de auditoría** para acciones importantes

### **Recomendaciones:**
- 🔐 Usa autenticación de dos factores
- 🔐 Genera contraseñas de aplicación específicas
- 🔐 Revisa regularmente los logs de acceso
- 🔐 Monitorea emails enviados
- 🔐 Configura políticas RLS específicas

## 👥 Credenciales de Prueba

### **Empresa:**
- Email: empresa1@ejemplo.com
- Password: empresa123

### **Candidato:**
- Email: candidato1@ejemplo.com
- Password: candidato123

### **Administrador:**
- Email: admin@compensamos.com
- Username: admin
- Password: admin123

## 🛠️ Comandos Útiles

### **Desarrollo:**
```bash
# Ejecutar en desarrollo
npm run dev

# Verificar tipos TypeScript
npm run check

# Construir proyecto
npm run build

# Preview de producción
npm run preview
```

### **Base de Datos:**
```bash
# Aplicar migraciones
npm run db:push

# Ver estado de la base de datos
npx drizzle-kit studio
```

## 🧪 Testing

### **Pruebas de Email:**
Para probar sin email configurado:
1. El código se muestra en la consola del navegador
2. Usar el código mostrado para verificar
3. Cambiar contraseña normalmente

### **Pruebas de Funcionalidad:**
1. Ejecuta el proyecto: `npm run dev`
2. Ve a la página de Email Masivo
3. Abre la consola del navegador para ver los logs de verificación
4. Intenta crear una plantilla usando el botón "Guardar Plantilla"

## 🚀 Próximos Pasos

### **Pendiente de Implementar:**
1. **Edge Functions** - Migrar API routes a Edge Functions
2. **Storage** - Configurar buckets para documentos
3. **Real-time** - Notificaciones en tiempo real
4. **RLS Policies** - Configurar políticas de seguridad específicas

### **Mejoras Futuras:**
1. **Performance** - Caché con React Query, optimización de consultas
2. **UX/UI** - Componentes optimizados, mejor experiencia de usuario
3. **Testing** - Tests unitarios, tests de integración
4. **Validación avanzada** - Reglas de negocio específicas
5. **Historial de cambios** - Registro de modificaciones
6. **Backup automático** - Respaldo de configuraciones
7. **Notificaciones** - Alertas de cambios importantes
8. **Exportación** - Generar reportes de configuración

## 📝 Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://vlmeifyldcgfmhppynir.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Email (Opcional)
SENDGRID_API_KEY=tu_api_key
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=tu-app-password
```

## 🛠️ Solución de Problemas

### **Error: "Authentication failed"**
- Verifica que la contraseña sea correcta
- Si tienes 2FA, usa contraseña de aplicación
- Habilita "Acceso de aplicaciones menos seguras"

### **Error: "Connection timeout"**
- Verifica tu conexión a internet
- Revisa que la Edge Function esté desplegada
- Verifica los logs de Supabase

### **Email no llega**
- Revisa la carpeta de spam
- Verifica que el correo de destino sea válido
- Revisa los logs de la Edge Function

### **Error en Edge Function**
- Verifica que nodemailer esté disponible
- Revisa los logs de la función
- Verifica la configuración de CORS

### **Error de tabla no encontrada**
- Asegúrate de que todas las tablas estén creadas correctamente
- Verifica que las políticas RLS (Row Level Security) estén configuradas correctamente
- Verifica que las credenciales de Supabase estén correctas en `supabaseClient.ts`

## 📊 Monitoreo

### **Logs a Revisar:**
```javascript
// En la consola del navegador
console.log('✅ Código enviado a email@ejemplo.com: 123456');

// En los logs de Supabase Edge Functions
console.log('Email enviado:', messageId);
```

### **Métricas a Monitorear:**
- ✅ Emails enviados exitosamente
- ✅ Errores de autenticación
- ✅ Tiempo de respuesta
- ✅ Códigos generados vs verificados

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema, contactar al equipo de desarrollo.

---

**Proyecto Supabase:** `rh-compensamos`  
**URL:** https://vlmeifyldcgfmhppynir.supabase.co  
**Estado:** ✅ Sistema Funcional  
**Versión:** 1.0.0  
**Última actualización:** Diciembre 2024  
**Desarrollado por:** Sistema de RRHH 