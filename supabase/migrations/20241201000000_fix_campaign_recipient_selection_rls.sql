-- Arreglar políticas RLS para campaign_recipient_selection
-- Primero habilitamos RLS en la tabla si no está habilitado
ALTER TABLE campaign_recipient_selection ENABLE ROW LEVEL SECURITY;

-- Eliminamos políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON campaign_recipient_selection;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON campaign_recipient_selection;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON campaign_recipient_selection;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON campaign_recipient_selection;

-- Creamos nuevas políticas más permisivas para usuarios autenticados
CREATE POLICY "Enable insert for authenticated users" ON campaign_recipient_selection
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON campaign_recipient_selection
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Enable update for authenticated users" ON campaign_recipient_selection
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON campaign_recipient_selection
    FOR DELETE 
    TO authenticated
    USING (true);

-- También permitimos acceso para el rol service_role (para funciones edge)
CREATE POLICY "Enable all for service_role" ON campaign_recipient_selection
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);
