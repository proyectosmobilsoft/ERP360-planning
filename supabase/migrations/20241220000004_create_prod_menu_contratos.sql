-- Crear tabla prod_menu_contratos
CREATE TABLE IF NOT EXISTS prod_menu_contratos (
    id SERIAL PRIMARY KEY,
    id_contrato INTEGER NOT NULL,
    id_unidad_servicio INTEGER NULL,
    num_menu INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    CONSTRAINT fk_inv_productos_menu_contratos FOREIGN KEY (id_producto) 
        REFERENCES inv_productos (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT foreing_key_id_contrato FOREIGN KEY (id_contrato) 
        REFERENCES prod_contratos (id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Crear índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_id_contrato_unique 
    ON prod_menu_contratos(id_contrato, num_menu, id_producto);

CREATE INDEX IF NOT EXISTS idx_fk_inv_productos_menu_contratos 
    ON prod_menu_contratos(id_producto);

