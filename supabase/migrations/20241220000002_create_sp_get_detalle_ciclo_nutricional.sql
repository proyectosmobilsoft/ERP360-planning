-- Crear procedimiento para obtener detalle del ciclo nutricional
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
    resultado RECORD;
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

    -- Crear tabla temporal para los resultados
    DROP TABLE IF EXISTS tmp_detalle_ciclo_nutricional;
    CREATE TEMP TABLE tmp_detalle_ciclo_nutricional (
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
    );

    -- Insertar el resultado principal
    INSERT INTO tmp_detalle_ciclo_nutricional
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
        COALESCE((
            SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'id_contrato', pmc.id_contrato,
                    'num_menu', pmc.num_menu,
                    'id', p.id,
                    'codigo', p.codigo,
                    'id_categoria', p.id_categoria,
                    'id_medida', p.id_medida,
                    'id_sublineas', p.id_sublineas,
                    'id_unidad_servicio', pmc.id_unidad_servicio,
                    'id_zona', zc.id,
                    'zona', zc.nombre,
                    'id_tipo_producto', p.id_tipo_producto,
                    'id_clase_servicio', p.id_clase_servicio,
                    'nombre_servicio', ts.nombre,
                    'nombre', p.nombre,
                    'id_linea', s.id_linea,
                    'ultimo_costo', p.ultimo_costo,
                    'detalle', COALESCE((
                        SELECT JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'id_componente', pcm.id,
                                'componente', pcm.nombre,
                                'detalle', COALESCE((
                                    SELECT JSONB_AGG(
                                        JSONB_BUILD_OBJECT(
                                            'id_detalle', mc.id,
                                            'id_clase_servicio', COALESCE(p2.id_clase_servicio, 0),
                                            'id_unidad_servicio', mc.id_unidad_servicio,
                                            'id_zona', zc2.id,
                                            'zona', zc2.nombre,
                                            'id_producto', mc.id_producto,
                                            'nombre', p2.nombre,
                                            'id_medida', mc.id_medida,
                                            'medida', im.abreviatura,
                                            'cantidad', mc.cantidad,
                                            'estado', mc.estado,
                                            'id_sublinea', p2.id_sublineas,
                                            'sublinea', s2.nombre,
                                            'costo', COALESCE(mc.costo, 0.00),
                                            'total', mc.cantidad * COALESCE(mc.costo, 0.00),
                                            'id_menu_contrato', mc.id_menu_contrato,
                                            'id_maestro_producto', mc.id_maestro_producto
                                        )
                                    )
                                    FROM prod_minutas_contratos mc
                                    JOIN prod_zonas_detalle_contratos dz2 ON mc.id_unidad_servicio = dz2.id_unidad_servicio
                                    JOIN prod_zonas_contrato zc2 ON dz2.id_zona = zc2.id
                                    INNER JOIN inv_productos p2 ON p2.id = mc.id_maestro_producto
                                    JOIN inv_medidas im ON im.id = mc.id_medida
                                    LEFT JOIN inv_medidas im2 ON im2.id = im.id_medida_principal
                                    JOIN inv_sublineas s2 ON s2.id = p2.id_sublineas
                                    WHERE pcm.id = s2.id_componente_menu  
                                      AND mc.id_contrato = p_id 
                                      AND mc.id_producto_menu = p.id 
                                      AND mc.id_maestro_producto != COALESCE(mc.id_producto, 0) 
                                      AND mc.id_producto IS NULL
                                ), '[]'::jsonb)
                            )
                        )
                        FROM prod_componentes_menus pcm
                        WHERE pcm.id IN (
                            SELECT DISTINCT s2.id_componente_menu
                            FROM inv_sublineas s2
                            WHERE s2.id = p.id_sublineas
                        )
                    ), '[]'::jsonb)
                )
            )
            FROM inv_productos p
            INNER JOIN prod_menu_contratos pmc ON pmc.id_producto = p.id
            JOIN prod_zonas_detalle_contratos dz ON pmc.id_unidad_servicio = dz.id_unidad_servicio
            JOIN prod_zonas_contrato zc ON dz.id_zona = zc.id
            INNER JOIN inv_sublineas s ON s.id = p.id_sublineas
            JOIN inv_clase_servicios ts ON ts.id = p.id_clase_servicio
            WHERE pmc.id_contrato = p_id 
            ORDER BY ts.orden
        ), '[]'::jsonb) AS detalle_ciclo_nutricional
    FROM prod_contratos pc 
    WHERE pc.id = p_id;

    -- Retornar los resultados
    RETURN QUERY SELECT * FROM tmp_detalle_ciclo_nutricional;

    -- Limpiar tabla temporal
    DROP TABLE IF EXISTS tmp_detalle_ciclo_nutricional;
END;
$$;
