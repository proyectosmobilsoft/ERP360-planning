-- Simplificar procedimiento para obtener detalle del ciclo nutricional
-- Solo retorna información básica del contrato y zonas por ahora
CREATE OR REPLACE FUNCTION sp_get_detalle_ciclo_nutricional(p_id INT)
RETURNS TABLE (
    id INTEGER,
    id_tercero INTEGER,
    id_usuario INTEGER,
    id_sucursal INTEGER,
    no_contrato TEXT,
    codigo TEXT,
    fecha_inicial TEXT,
    fecha_final TEXT,
    fecha_arranque TEXT,
    objetivo TEXT,
    observacion TEXT,
    tasa_impuesto NUMERIC,
    valor_racion NUMERIC,
    valor_contrato NUMERIC,
    valor_facturado NUMERIC,
    estado TEXT,
    no_ppl INTEGER,
    no_ciclos INTEGER,
    no_servicios INTEGER,
    zonas JSONB,
    detalle_ciclo_nutricional JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    lc_zonas JSONB;
BEGIN
    -- Obtener las zonas del contrato
    SELECT COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id_detalle', pzc.id,
                'id_zona', pz.id,
                'codigo', pz.codigo,
                'nombre', pz.nombre,
                'no_ppl', pz.no_ppl
            )
        ), '[]'::jsonb
    ) INTO lc_zonas
    FROM prod_zonas_by_contrato pzc
    INNER JOIN prod_zonas_contrato pz ON pz.id = pzc.id_zona
    WHERE pzc.id_contrato = p_id;

    -- Retornar los resultados directamente
    RETURN QUERY
    SELECT 
        pc.id,
        pc.id_tercero,
        pc.id_usuario,
        pc.id_sucursal,
        pc.no_contrato,
        pc.codigo,
        TO_CHAR(pc.fecha_inicial, 'YYYY-MM-DD') AS fecha_inicial,
        TO_CHAR(pc.fecha_final, 'YYYY-MM-DD') AS fecha_final,
        TO_CHAR(pc.fecha_arranque, 'YYYY-MM-DD') AS fecha_arranque,
        pc.objetivo,
        pc.observacion,
        pc.tasa_impuesto,
        pc.valor_racion,
        pc.valor_contrato,
        pc.valor_facturado,
        pc.estado,
        pc.no_ppl,
        pc.no_ciclos,
        pc.no_servicios,
        COALESCE(lc_zonas, '[]'::jsonb) AS zonas,
        '[]'::jsonb AS detalle_ciclo_nutricional -- Por ahora retorna un array vacío
    FROM prod_contratos pc 
    WHERE pc.id = p_id;
END;
$$;

