-- Migración para corregir num_menu en prod_menu_contratos
-- Convierte valores string "Estandar" a números secuenciales (1, 2, 3...)
-- y asegura que los números sean consecutivos sin espacios

-- Función para renumerar los menús de un contrato de forma secuencial
CREATE OR REPLACE FUNCTION fix_num_menu_secuencial(p_id_contrato INT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    nuevo_num_menu INTEGER := 1;
BEGIN
    -- Primero, corregir los que tienen "Estandar" o cualquier string
    -- Asignar números secuenciales basados en el orden de id
    FOR rec IN 
        SELECT id, id_unidad_servicio, id_producto
        FROM prod_menu_contratos
        WHERE id_contrato = p_id_contrato
        ORDER BY id_unidad_servicio, id
    LOOP
        -- Actualizar con el número secuencial
        UPDATE prod_menu_contratos
        SET num_menu = nuevo_num_menu
        WHERE id = rec.id;
        
        nuevo_num_menu := nuevo_num_menu + 1;
    END LOOP;
    
    -- Ahora asegurar que los números sean consecutivos sin espacios
    -- Renumerar todos los menús del contrato de forma secuencial
    nuevo_num_menu := 1;
    
    FOR rec IN 
        SELECT DISTINCT id_unidad_servicio, num_menu
        FROM prod_menu_contratos
        WHERE id_contrato = p_id_contrato
        ORDER BY id_unidad_servicio, num_menu, id
    LOOP
        -- Actualizar todos los registros con el mismo num_menu en la misma unidad de servicio
        UPDATE prod_menu_contratos
        SET num_menu = nuevo_num_menu
        WHERE id_contrato = p_id_contrato
          AND id_unidad_servicio = rec.id_unidad_servicio
          AND num_menu = rec.num_menu;
        
        nuevo_num_menu := nuevo_num_menu + 1;
    END LOOP;
END;
$$;

-- Función para corregir todos los contratos que tengan num_menu como string
CREATE OR REPLACE FUNCTION fix_all_num_menu_secuencial()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    contrato_rec RECORD;
BEGIN
    -- Obtener todos los contratos que tienen menús con num_menu como string o no secuencial
    FOR contrato_rec IN 
        SELECT DISTINCT id_contrato
        FROM prod_menu_contratos
        WHERE num_menu::text ~ '[^0-9]'  -- Contiene caracteres no numéricos
           OR num_menu IS NULL
    LOOP
        -- Corregir cada contrato
        PERFORM fix_num_menu_secuencial(contrato_rec.id_contrato);
    END LOOP;
    
    -- También corregir contratos donde los números no son consecutivos
    FOR contrato_rec IN 
        SELECT DISTINCT pmc1.id_contrato
        FROM prod_menu_contratos pmc1
        WHERE EXISTS (
            SELECT 1
            FROM prod_menu_contratos pmc2
            WHERE pmc2.id_contrato = pmc1.id_contrato
              AND pmc2.id_unidad_servicio = pmc1.id_unidad_servicio
              AND pmc2.num_menu > pmc1.num_menu + 1
              AND NOT EXISTS (
                  SELECT 1
                  FROM prod_menu_contratos pmc3
                  WHERE pmc3.id_contrato = pmc1.id_contrato
                    AND pmc3.id_unidad_servicio = pmc1.id_unidad_servicio
                    AND pmc3.num_menu = pmc1.num_menu + 1
              )
        )
    LOOP
        PERFORM fix_num_menu_secuencial(contrato_rec.id_contrato);
    END LOOP;
END;
$$;

-- Ejecutar la corrección para todos los contratos
SELECT fix_all_num_menu_secuencial();

-- Crear función para obtener el siguiente num_menu disponible para un contrato y unidad de servicio
CREATE OR REPLACE FUNCTION get_next_num_menu(
    p_id_contrato INT,
    p_id_unidad_servicio INT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    max_num_menu INTEGER;
BEGIN
    SELECT COALESCE(MAX(num_menu), 0)
    INTO max_num_menu
    FROM prod_menu_contratos
    WHERE id_contrato = p_id_contrato
      AND id_unidad_servicio = p_id_unidad_servicio;
    
    RETURN max_num_menu + 1;
END;
$$;

-- Crear trigger para asegurar que num_menu sea siempre un número secuencial al insertar
CREATE OR REPLACE FUNCTION ensure_secuencial_num_menu()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Si num_menu es NULL o es un string, calcular el siguiente número
    IF NEW.num_menu IS NULL OR NEW.num_menu::text ~ '[^0-9]' THEN
        NEW.num_menu := get_next_num_menu(NEW.id_contrato, NEW.id_unidad_servicio);
    ELSE
        -- Verificar si el número ya existe para este contrato y unidad de servicio
        IF EXISTS (
            SELECT 1
            FROM prod_menu_contratos
            WHERE id_contrato = NEW.id_contrato
              AND id_unidad_servicio = NEW.id_unidad_servicio
              AND num_menu = NEW.num_menu
              AND id != NEW.id
        ) THEN
            -- Si existe, usar el siguiente disponible
            NEW.num_menu := get_next_num_menu(NEW.id_contrato, NEW.id_unidad_servicio);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_ensure_secuencial_num_menu ON prod_menu_contratos;
CREATE TRIGGER trigger_ensure_secuencial_num_menu
    BEFORE INSERT OR UPDATE ON prod_menu_contratos
    FOR EACH ROW
    EXECUTE FUNCTION ensure_secuencial_num_menu();

-- Comentarios
COMMENT ON FUNCTION fix_num_menu_secuencial(INT) IS 'Corrige los num_menu de un contrato para que sean secuenciales (1, 2, 3...)';
COMMENT ON FUNCTION fix_all_num_menu_secuencial() IS 'Corrige todos los contratos que tengan num_menu como string o no secuencial';
COMMENT ON FUNCTION get_next_num_menu(INT, INT) IS 'Obtiene el siguiente número de menú disponible para un contrato y unidad de servicio';
COMMENT ON FUNCTION ensure_secuencial_num_menu() IS 'Trigger que asegura que num_menu sea siempre un número secuencial al insertar o actualizar';

