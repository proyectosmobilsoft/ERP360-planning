-- =============================================================================
-- MIGRACIÓN COMPLETA: ESQUEMA DE BASE DE DATOS ERP360-INVENTORY
-- =============================================================================
-- Descripción: Script completo con todas las tablas que utiliza el proyecto
-- Fecha: 2024-12-19
-- Autor: Sistema ERP360
-- =============================================================================
-- Eliminar tablas existentes si existen (para recrear desde cero)
DROP TABLE IF EXISTS gen_usuario_empresas CASCADE;

DROP TABLE IF EXISTS gen_usuario_roles CASCADE;

DROP TABLE IF EXISTS gen_roles_modulos CASCADE;

DROP TABLE IF EXISTS gen_modulo_permisos CASCADE;

DROP TABLE IF EXISTS gen_roles CASCADE;

DROP TABLE IF EXISTS gen_modulos CASCADE;

DROP TABLE IF EXISTS gen_usuarios CASCADE;

DROP TABLE IF EXISTS empresas CASCADE;

-- =============================================================================
-- 1. TABLA EMPRESAS
-- =============================================================================
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    nit VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento VARCHAR(20) DEFAULT 'nit',
    regimen_tributario_id VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    representante_legal VARCHAR(255),
    numero_empleados INTEGER DEFAULT 1,
    tipo_empresa VARCHAR(20) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    documento_contrato TEXT,
    documento_camara_comercio TEXT,
    documento_rut TEXT,
    actividad_economica_id VARCHAR(10),
    logo_base64 TEXT
);

COMMENT ON TABLE empresas IS 'Empresas afiliadas al sistema';

-- =============================================================================
-- 2. TABLA USUARIOS PRINCIPALES
-- =============================================================================
CREATE TABLE gen_usuarios (
    id SERIAL PRIMARY KEY,
    identificacion VARCHAR(255),
    primer_nombre VARCHAR(255) NOT NULL,
    segundo_nombre VARCHAR(255),
    primer_apellido VARCHAR(255) NOT NULL,
    segundo_apellido VARCHAR(255),
    telefono VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    foto_base64 TEXT,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gen_usuarios IS 'Tabla principal de usuarios del sistema';

COMMENT ON COLUMN gen_usuarios.password_hash IS 'Hash seguro de la contraseña del usuario';

COMMENT ON COLUMN gen_usuarios.foto_base64 IS 'Foto del usuario en formato base64';

COMMENT ON COLUMN gen_usuarios.ultimo_acceso IS 'Timestamp del último acceso del usuario';

-- =============================================================================
-- 3. TABLA MÓDULOS DEL SISTEMA
-- =============================================================================
CREATE TABLE gen_modulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gen_modulos IS 'Tabla de módulos del sistema';

-- =============================================================================
-- 4. TABLA ROLES/PERFILES
-- =============================================================================
CREATE TABLE gen_roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gen_roles IS 'Tabla de roles/perfiles del sistema';

-- =============================================================================
-- 5. TABLA PERMISOS POR MÓDULO
-- =============================================================================
CREATE TABLE gen_modulo_permisos (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    code VARCHAR(255) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gen_modulo_permisos IS 'Tabla de permisos por módulo';

COMMENT ON COLUMN gen_modulo_permisos.code IS 'Código único del permiso para uso programático';

-- =============================================================================
-- 6. TABLAS DE RELACIONES MUCHOS A MUCHOS
-- =============================================================================
-- Relación usuarios - roles
CREATE TABLE gen_usuario_roles (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    rol_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gen_usuario_roles IS 'Tabla de relación muchos a muchos entre usuarios y roles';

-- Relación usuarios - empresas
CREATE TABLE gen_usuario_empresas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gen_usuario_empresas IS 'Tabla de relación muchos a muchos entre usuarios y empresas';

-- Relación roles - módulos con permisos específicos
CREATE TABLE gen_roles_modulos (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER NOT NULL,
    modulo_id INTEGER NOT NULL,
    selected_actions_codes TEXT [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gen_roles_modulos IS 'Tabla de relación muchos a muchos entre roles y módulos con permisos específicos';

COMMENT ON COLUMN gen_roles_modulos.selected_actions_codes IS 'Array de códigos de permisos seleccionados para este rol en este módulo';

-- =============================================================================
-- 7. FOREIGN KEY CONSTRAINTS
-- =============================================================================
-- Constraints para gen_modulo_permisos
ALTER TABLE
    gen_modulo_permisos
ADD
    CONSTRAINT gen_modulo_permisos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES gen_modulos(id) ON DELETE CASCADE;

-- Constraints para gen_usuario_roles
ALTER TABLE
    gen_usuario_roles
ADD
    CONSTRAINT gen_usuario_roles_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES gen_usuarios(id) ON DELETE CASCADE;

ALTER TABLE
    gen_usuario_roles
ADD
    CONSTRAINT gen_usuario_roles_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES gen_roles(id) ON DELETE CASCADE;

-- Constraints para gen_usuario_empresas
ALTER TABLE
    gen_usuario_empresas
ADD
    CONSTRAINT gen_usuario_empresas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES gen_usuarios(id) ON DELETE CASCADE;

ALTER TABLE
    gen_usuario_empresas
ADD
    CONSTRAINT gen_usuario_empresas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- Constraints para gen_roles_modulos
ALTER TABLE
    gen_roles_modulos
ADD
    CONSTRAINT gen_roles_modulos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES gen_roles(id) ON DELETE CASCADE;

ALTER TABLE
    gen_roles_modulos
ADD
    CONSTRAINT gen_roles_modulos_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES gen_modulos(id) ON DELETE CASCADE;

-- =============================================================================
-- 8. ÍNDICES PARA MEJOR RENDIMIENTO
-- =============================================================================
-- Índices únicos importantes
CREATE UNIQUE INDEX idx_empresas_nit ON empresas(nit);

CREATE UNIQUE INDEX idx_gen_usuarios_email ON gen_usuarios(email);

CREATE UNIQUE INDEX idx_gen_usuarios_username ON gen_usuarios(username);

CREATE UNIQUE INDEX idx_gen_modulos_nombre ON gen_modulos(nombre);

CREATE UNIQUE INDEX idx_gen_modulo_permisos_code ON gen_modulo_permisos(code);

-- Índices para foreign keys y consultas frecuentes
CREATE INDEX idx_gen_usuario_roles_usuario_id ON gen_usuario_roles(usuario_id);

CREATE INDEX idx_gen_usuario_roles_rol_id ON gen_usuario_roles(rol_id);

CREATE INDEX idx_gen_usuario_empresas_usuario_id ON gen_usuario_empresas(usuario_id);

CREATE INDEX idx_gen_usuario_empresas_empresa_id ON gen_usuario_empresas(empresa_id);

CREATE INDEX idx_gen_roles_modulos_rol_id ON gen_roles_modulos(rol_id);

CREATE INDEX idx_gen_roles_modulos_modulo_id ON gen_roles_modulos(modulo_id);

CREATE INDEX idx_gen_modulo_permisos_modulo_id ON gen_modulo_permisos(modulo_id);

-- Índices para campos de estado y fechas
CREATE INDEX idx_empresas_activo ON empresas(activo);

CREATE INDEX idx_gen_usuarios_activo ON gen_usuarios(activo);

CREATE INDEX idx_gen_usuarios_ultimo_acceso ON gen_usuarios(ultimo_acceso);

CREATE INDEX idx_gen_roles_activo ON gen_roles(activo);

CREATE INDEX idx_gen_modulos_activo ON gen_modulos(activo);

CREATE INDEX idx_gen_modulo_permisos_activo ON gen_modulo_permisos(activo);

-- =============================================================================
-- 9. DATOS INICIALES - MÓDULOS DEL SISTEMA
-- =============================================================================
INSERT INTO
    gen_modulos (nombre, descripcion, activo)
VALUES
    (
        'Seguridad',
        'Gestión de usuarios, roles y permisos',
        true
    ),
    (
        'Empresas',
        'Gestión de empresas afiliadas',
        true
    ),
    ('Dashboard', 'Panel principal del sistema', true);

-- =============================================================================
-- 10. DATOS INICIALES - PERMISOS POR MÓDULO
-- =============================================================================
-- Permisos para el módulo Seguridad
INSERT INTO
    gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo)
VALUES
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Ver Usuarios',
        'Permite visualizar la lista de usuarios',
        'usuarios_view',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Crear Usuarios',
        'Permite crear nuevos usuarios',
        'usuarios_create',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Editar Usuarios',
        'Permite modificar usuarios existentes',
        'usuarios_edit',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Eliminar Usuarios',
        'Permite eliminar usuarios',
        'usuarios_delete',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Ver Roles',
        'Permite visualizar la lista de roles',
        'roles_view',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Crear Roles',
        'Permite crear nuevos roles',
        'roles_create',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Editar Roles',
        'Permite modificar roles existentes',
        'roles_edit',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Seguridad'
        ),
        'Eliminar Roles',
        'Permite eliminar roles',
        'roles_delete',
        true
    );

-- Permisos para el módulo Empresas
INSERT INTO
    gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo)
VALUES
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Empresas'
        ),
        'Ver Empresas',
        'Permite visualizar la lista de empresas',
        'empresas_view',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Empresas'
        ),
        'Crear Empresas',
        'Permite crear nuevas empresas',
        'empresas_create',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Empresas'
        ),
        'Editar Empresas',
        'Permite modificar empresas existentes',
        'empresas_edit',
        true
    ),
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Empresas'
        ),
        'Eliminar Empresas',
        'Permite eliminar empresas',
        'empresas_delete',
        true
    );

-- Permisos para el módulo Dashboard
INSERT INTO
    gen_modulo_permisos (modulo_id, nombre, descripcion, code, activo)
VALUES
    (
        (
            SELECT
                id
            FROM
                gen_modulos
            WHERE
                nombre = 'Dashboard'
        ),
        'Ver Dashboard',
        'Permite acceder al panel principal',
        'dashboard_view',
        true
    );

-- =============================================================================
-- 11. DATOS INICIALES - ROLES
-- =============================================================================
INSERT INTO
    gen_roles (nombre, descripcion, activo)
VALUES
    (
        'Super Administrador',
        'Acceso completo a todo el sistema',
        true
    ),
    (
        'Administrador',
        'Gestión de usuarios y configuración',
        true
    ),
    ('Usuario', 'Acceso básico al sistema', true);

-- =============================================================================
-- 12. HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE
    empresas ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    gen_usuarios ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    gen_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    gen_modulos ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    gen_modulo_permisos ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    gen_usuario_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    gen_usuario_empresas ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    gen_roles_modulos ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 13. POLÍTICAS RLS BÁSICAS (OPCIONAL - AJUSTAR SEGÚN NECESIDADES)
-- =============================================================================
-- Política para que los usuarios puedan ver sus propios datos
CREATE POLICY "Users can view own data" ON gen_usuarios FOR
SELECT
    USING (
        auth.uid() :: text = id :: text
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Política para que los usuarios puedan ver empresas asociadas
CREATE POLICY "Users can view associated companies" ON empresas FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                gen_usuario_empresas ue
            WHERE
                ue.empresa_id = empresas.id
                AND ue.usuario_id :: text = auth.uid() :: text
        )
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- =============================================================================
-- 14. FUNCIONES DE UTILIDAD (OPCIONAL)
-- =============================================================================
-- Función para actualizar timestamp automáticamente
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;

RETURN NEW;

END;

$ $ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_empresas_updated_at BEFORE
UPDATE
    ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gen_usuarios_updated_at BEFORE
UPDATE
    ON gen_usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gen_roles_updated_at BEFORE
UPDATE
    ON gen_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gen_modulos_updated_at BEFORE
UPDATE
    ON gen_modulos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gen_modulo_permisos_updated_at BEFORE
UPDATE
    ON gen_modulo_permisos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column() -- Migración para crear la tabla codigos_verificacion
    -- Esta tabla almacena los códigos de verificación para recuperación de contraseñas
    CREATE TABLE IF NOT EXISTS codigos_verificacion (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        codigo VARCHAR(10) NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'recuperacion',
        usado BOOLEAN NOT NULL DEFAULT FALSE,
        fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_email ON codigos_verificacion(email);

CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_codigo ON codigos_verificacion(codigo);

CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_tipo ON codigos_verificacion(tipo);

CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_usado ON codigos_verificacion(usado);

CREATE INDEX IF NOT EXISTS idx_codigos_verificacion_expiracion ON codigos_verificacion(fecha_expiracion);

-- Comentarios para documentar la tabla
COMMENT ON TABLE codigos_verificacion IS 'Tabla para almacenar códigos de verificación para recuperación de contraseñas';

COMMENT ON COLUMN codigos_verificacion.email IS 'Email del usuario que solicita la recuperación';

COMMENT ON COLUMN codigos_verificacion.codigo IS 'Código de verificación de 6 dígitos';

COMMENT ON COLUMN codigos_verificacion.tipo IS 'Tipo de verificación (recuperacion, activacion, etc.)';

COMMENT ON COLUMN codigos_verificacion.usado IS 'Indica si el código ya fue utilizado';

COMMENT ON COLUMN codigos_verificacion.fecha_creacion IS 'Fecha y hora de creación del código';

COMMENT ON COLUMN codigos_verificacion.fecha_expiracion IS 'Fecha y hora de expiración del código';

-- Función para limpiar códigos expirados automáticamente
CREATE
OR REPLACE FUNCTION limpiar_codigos_expirados() RETURNS void AS $ $ BEGIN
DELETE FROM
    codigos_verificacion
WHERE
    fecha_expiracion < NOW()
    AND usado = FALSE;

END;

$ $ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER update_codigos_verificacion_updated_at BEFORE
UPDATE
    ON codigos_verificacion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Política RLS (Row Level Security) si es necesario
-- ALTER TABLE codigos_verificacion ENABLE ROW LEVEL SECURITY;
-- Crear política para que los usuarios solo puedan ver sus propios códigos
-- CREATE POLICY "Users can view their own verification codes" ON codigos_verificacion
--     FOR SELECT USING (email = current_setting('app.current_user_email', true));
-- Crear política para insertar códigos
-- CREATE POLICY "Users can insert verification codes" ON codigos_verificacion
--     FOR INSERT WITH CHECK (true);
-- Crear política para actualizar códigos
-- CREATE POLICY "Users can update verification codes" ON codigos_verificacion
--     FOR UPDATE USING (email = current_setting('app.current_user_email', true));
-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
SELECT
    table_name,
    (
        SELECT
            count(*)
        FROM
            information_schema.columns
        WHERE
            table_name = t.table_name
    ) as column_count
FROM
    information_schema.tables t
WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'empresas',
        'gen_usuarios',
        'gen_roles',
        'gen_modulos',
        'gen_modulo_permisos',
        'gen_usuario_roles',
        'gen_usuario_empresas',
        'gen_roles_modulos'
    )
ORDER BY
    table_name;