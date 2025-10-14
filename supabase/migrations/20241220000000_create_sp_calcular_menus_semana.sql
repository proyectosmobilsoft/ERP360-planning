-- =============================================================================
-- MIGRACIÓN: PROCEDIMIENTO SP_CALCULAR_MENUS_SEMANA
-- =============================================================================
-- Descripción: Crear procedimiento almacenado para calcular menús de la semana
-- Fecha: 2024-12-20
-- Autor: Sistema ERP360
-- =============================================================================

-- Función auxiliar para calcular el ciclo actual
CREATE OR REPLACE FUNCTION calcula_ciclo_actual(p_idcontrato INT, p_fecha DATE)
RETURNS INTEGER AS $$
DECLARE
    fecha_arranque DATE;
    no_ciclos INTEGER;
    fecha_inicio_contrato DATE;
    dias_transcurridos INTEGER;
    variable_ciclo DECIMAL;
    decimales DECIMAL;
    ciclo_actual INTEGER;
BEGIN
    -- Obtener fecha_arranque y no_ciclos del contrato
    SELECT fecha_arranque, no_ciclos 
    INTO fecha_arranque, no_ciclos 
    FROM prod_contratos 
    WHERE id = p_idcontrato;
    
    -- Calcular fecha_inicio_contrato (fecha_arranque - 1 día)
    fecha_inicio_contrato := fecha_arranque - INTERVAL '1 day';
    
    -- Calcular días transcurridos
    dias_transcurridos := p_fecha - fecha_inicio_contrato;
    
    -- Calcular variable_ciclo
    variable_ciclo := dias_transcurridos::DECIMAL / no_ciclos::DECIMAL;
    
    -- Calcular decimales
    decimales := variable_ciclo - FLOOR(variable_ciclo);
    
    -- Calcular ciclo_actual
    IF decimales = 0 THEN
        ciclo_actual := no_ciclos;
    ELSIF decimales > 0 THEN
        ciclo_actual := ROUND(no_ciclos * decimales);
    ELSE
        ciclo_actual := 1;
    END IF;
    
    -- Asegurar que el ciclo esté entre 1 y no_ciclos
    IF ciclo_actual < 1 THEN
        ciclo_actual := 1;
    ELSIF ciclo_actual > no_ciclos THEN
        ciclo_actual := no_ciclos;
    END IF;
    
    RETURN ciclo_actual;
END;
$$ LANGUAGE plpgsql;

-- Procedimiento principal Sp_calcular_menus_semana
CREATE OR REPLACE FUNCTION sp_calcular_menus_semana(p_idcontrato INT)
RETURNS TABLE(
    fecha DATE,
    ciclos INTEGER
) AS $$
DECLARE
    fecha DATE DEFAULT CURRENT_DATE;
    fecha_proximo_viernes DATE DEFAULT CURRENT_DATE;
    fecha_viernes_anterior DATE DEFAULT CURRENT_DATE;
    nom_ciclos INT;
    max_fecha DATE;
BEGIN
    -- Obtener fecha_arranque y no_ciclos del contrato
    SELECT fecha_arranque, no_ciclos 
    INTO fecha, nom_ciclos 
    FROM prod_contratos 
    WHERE id = p_idcontrato;
    
    -- Obtener la fecha máxima de planeación existente
    SELECT MAX(fecha_final) 
    INTO max_fecha 
    FROM prod_planeacion_contratos 
    WHERE id_contrato = p_idcontrato;
    
    -- Determinar fecha_viernes_anterior
    IF max_fecha IS NULL THEN
        -- Si no hay planeaciones, buscar el próximo viernes desde fecha_arranque
        fecha := fecha_arranque;
        WHILE EXTRACT(DOW FROM fecha) <> 5 LOOP
            fecha := fecha + INTERVAL '1 day';
        END LOOP;
        fecha_viernes_anterior := fecha;
    ELSE
        -- Si hay planeaciones, empezar el día siguiente a la fecha máxima
        fecha_viernes_anterior := max_fecha + INTERVAL '1 day';
    END IF;
    
    -- Calcular fecha_proximo_viernes
    fecha_proximo_viernes := fecha_viernes_anterior + (nom_ciclos - 1) * INTERVAL '1 day';
    
    -- Generar las fechas y ciclos
    fecha := fecha_viernes_anterior - INTERVAL '1 day';
    
    WHILE fecha < fecha_proximo_viernes LOOP
        fecha := fecha + INTERVAL '1 day';
        
        -- Insertar en la tabla temporal de retorno
        RETURN QUERY SELECT 
            fecha,
            calcula_ciclo_actual(p_idcontrato, fecha);
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Función auxiliar para obtener las fechas de inicio y fin
CREATE OR REPLACE FUNCTION sp_calcular_menus_semana_fechas(p_idcontrato INT)
RETURNS TABLE(
    inicio DATE,
    fin DATE
) AS $$
DECLARE
    fecha DATE DEFAULT CURRENT_DATE;
    fecha_proximo_viernes DATE DEFAULT CURRENT_DATE;
    fecha_viernes_anterior DATE DEFAULT CURRENT_DATE;
    nom_ciclos INT;
    max_fecha DATE;
BEGIN
    -- Obtener fecha_arranque y no_ciclos del contrato
    SELECT fecha_arranque, no_ciclos 
    INTO fecha, nom_ciclos 
    FROM prod_contratos 
    WHERE id = p_idcontrato;
    
    -- Obtener la fecha máxima de planeación existente
    SELECT MAX(fecha_final) 
    INTO max_fecha 
    FROM prod_planeacion_contratos 
    WHERE id_contrato = p_idcontrato;
    
    -- Determinar fecha_viernes_anterior
    IF max_fecha IS NULL THEN
        -- Si no hay planeaciones, buscar el próximo viernes desde fecha_arranque
        fecha := fecha_arranque;
        WHILE EXTRACT(DOW FROM fecha) <> 5 LOOP
            fecha := fecha + INTERVAL '1 day';
        END LOOP;
        fecha_viernes_anterior := fecha;
    ELSE
        -- Si hay planeaciones, empezar el día siguiente a la fecha máxima
        fecha_viernes_anterior := max_fecha + INTERVAL '1 day';
    END IF;
    
    -- Calcular fecha_proximo_viernes
    fecha_proximo_viernes := fecha_viernes_anterior + (nom_ciclos - 1) * INTERVAL '1 day';
    
    -- Retornar las fechas
    RETURN QUERY SELECT 
        fecha_viernes_anterior,
        fecha_proximo_viernes;
        
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentar las funciones
COMMENT ON FUNCTION calcula_ciclo_actual(INT, DATE) IS 'Función auxiliar para calcular el ciclo actual basado en la fecha y contrato';
COMMENT ON FUNCTION sp_calcular_menus_semana(INT) IS 'Procedimiento principal para calcular los menús de la semana con fechas y ciclos';
COMMENT ON FUNCTION sp_calcular_menus_semana_fechas(INT) IS 'Función auxiliar para obtener solo las fechas de inicio y fin del período calculado';
