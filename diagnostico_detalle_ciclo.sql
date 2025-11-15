-- Consulta de diagnóstico para identificar por qué detalle_ciclo_nutricional está vacío
-- Reemplaza 4 con el ID del contrato que estás consultando

-- 1. Verificar si hay menús en prod_menu_contratos para el contrato
SELECT 
    'Menús en prod_menu_contratos' as tipo_consulta,
    COUNT(*) as cantidad
FROM prod_menu_contratos pmc
WHERE pmc.id_contrato = 4;

-- 2. Verificar si hay minutas en prod_minutas_contratos para el contrato
SELECT 
    'Minutas en prod_minutas_contratos' as tipo_consulta,
    COUNT(*) as cantidad
FROM prod_minutas_contratos mc
WHERE mc.id_contrato = 4;

-- 3. Verificar minutas que cumplen las condiciones del procedimiento
SELECT 
    'Minutas que cumplen condiciones' as tipo_consulta,
    COUNT(*) as cantidad
FROM prod_minutas_contratos mc
WHERE mc.id_contrato = 4
  AND mc.id_producto IS NULL
  AND mc.id_maestro_producto != COALESCE(mc.id_producto, 0);

-- 4. Verificar minutas con id_producto NULL (condición clave)
SELECT 
    'Minutas con id_producto NULL' as tipo_consulta,
    COUNT(*) as cantidad,
    COUNT(DISTINCT mc.id_producto_menu) as productos_menu_distintos
FROM prod_minutas_contratos mc
WHERE mc.id_contrato = 4
  AND mc.id_producto IS NULL;

-- 5. Verificar la relación entre menús y minutas
SELECT 
    pmc.id,
    pmc.id_contrato,
    pmc.id_producto,
    pmc.num_menu,
    COUNT(mc.id) as cantidad_minutas,
    COUNT(CASE WHEN mc.id_producto IS NULL THEN 1 END) as minutas_sin_producto
FROM prod_menu_contratos pmc
LEFT JOIN prod_minutas_contratos mc ON mc.id_menu_contrato = pmc.id AND mc.id_contrato = pmc.id_contrato
WHERE pmc.id_contrato = 4
GROUP BY pmc.id, pmc.id_contrato, pmc.id_producto, pmc.num_menu;

-- 6. Verificar si hay zonas detalle para el contrato
SELECT 
    'Zonas detalle' as tipo_consulta,
    COUNT(*) as cantidad
FROM prod_zonas_detalle_contratos dz
WHERE dz.id_contrato = 4;

-- 7. Consulta completa para ver qué está faltando
SELECT 
    'Resumen' as tipo,
    (SELECT COUNT(*) FROM prod_menu_contratos WHERE id_contrato = 4) as total_menus,
    (SELECT COUNT(*) FROM prod_minutas_contratos WHERE id_contrato = 4) as total_minutas,
    (SELECT COUNT(*) FROM prod_minutas_contratos WHERE id_contrato = 4 AND id_producto IS NULL) as minutas_sin_producto,
    (SELECT COUNT(*) FROM prod_zonas_detalle_contratos WHERE id_contrato = 4) as total_zonas_detalle;

