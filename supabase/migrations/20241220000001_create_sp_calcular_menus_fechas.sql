-- Crear el procedimiento almacenado Sp_calcular_menus_fechas
-- Este procedimiento calcula los menús para un rango de fechas específico

CREATE OR REPLACE FUNCTION sp_calcular_menus_fechas(
  p_idcontrato INT,
  p_fechainicio DATE,
  p_fechafin DATE
)
RETURNS TABLE (
  fecha DATE,
  ciclos INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  fecha_actual DATE;
BEGIN
  -- Crear tabla temporal para almacenar los resultados
  DROP TABLE IF EXISTS tmp_menus_fechas_contratos;
  CREATE TEMP TABLE tmp_menus_fechas_contratos (
    fecha DATE,
    ciclos INTEGER
  );
  
  -- Inicializar la fecha actual un día antes de la fecha de inicio
  fecha_actual := p_fechainicio - INTERVAL '1 day';
  
  -- Iterar desde la fecha de inicio hasta la fecha final
  WHILE fecha_actual < p_fechafin LOOP
    -- Incrementar la fecha en un día
    fecha_actual := fecha_actual + INTERVAL '1 day';
    
    -- Insertar el registro con la fecha y el ciclo calculado
    INSERT INTO tmp_menus_fechas_contratos (fecha, ciclos)
    VALUES (fecha_actual, calcula_ciclo_actual(p_idcontrato, fecha_actual));
  END LOOP;
  
  -- Retornar los resultados
  RETURN QUERY SELECT * FROM tmp_menus_fechas_contratos ORDER BY tmp_menus_fechas_contratos.fecha;
  
  -- Limpiar la tabla temporal
  DROP TABLE IF EXISTS tmp_menus_fechas_contratos;
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION sp_calcular_menus_fechas(INT, DATE, DATE) IS 
'Calcula los ciclos de menús para un contrato en un rango de fechas específico. 
Parámetros:
- p_idcontrato: ID del contrato
- p_fechainicio: Fecha de inicio del rango
- p_fechafin: Fecha final del rango
Retorna: Una tabla con las fechas y sus ciclos correspondientes';

