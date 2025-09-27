import { supabase } from './supabaseClient';

export interface UsuarioData {
  id?: number;
  identificacion?: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  telefono?: string;
  email: string;
  username: string;
  activo?: boolean;
  password_hash?: string;
  foto_base64?: string;
  ultimo_acceso?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const usuariosService = {
  // Listar todos los usuarios con sus roles y empresas
  async listUsuarios() {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .select(`
        id,
        identificacion,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        telefono,
        email,
        username,
        activo,
        foto_base64,
        created_at,
        gen_usuario_roles ( id, rol_id, created_at, gen_roles ( id, nombre ) ),
        gen_usuario_empresas ( id, empresa_id, created_at, empresas ( id, razon_social ) )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Crear un nuevo usuario y asignarle roles y empresas
  async createUsuario(usuarioData: UsuarioData, password: string, rolesIds: number[], empresaIds: number[]) {
    console.log("➕ usuariosService: createUsuario llamado con:", { usuarioData, rolesIds, empresaIds });
    console.log("➕ CONFIRMACIÓN: Estamos en createUsuario, NO en updateUsuario");
    
    // Validar username único antes de crear
    console.log(`🔍 Validando username único para nuevo usuario: "${usuarioData.username}"`);
    const { data: existingUsers, error: checkError } = await supabase
      .from('gen_usuarios')
      .select('id, username, primer_nombre, primer_apellido')
      .eq('username', usuarioData.username);
    
    console.log('📊 Resultado verificación username (crear):', { existingUsers, checkError });
    
    if (checkError) {
      console.error('❌ Error verificando username único:', checkError);
      throw new Error('Error verificando la unicidad del username');
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.error('❌ Username ya existe:', existingUsers);
      throw new Error(`El username '${usuarioData.username}' ya está en uso por: ${existingUsers[0].primer_nombre} ${existingUsers[0].primer_apellido} (ID: ${existingUsers[0].id})`);
    }
    
    // Validar email único antes de crear
    console.log(`🔍 Validando email único para nuevo usuario: "${usuarioData.email}"`);
    const { data: existingEmails, error: emailCheckError } = await supabase
      .from('gen_usuarios')
      .select('id, email, primer_nombre, primer_apellido')
      .eq('email', usuarioData.email);
    
    console.log('📊 Resultado verificación email (crear):', { existingEmails, emailCheckError });
    
    if (emailCheckError) {
      console.error('❌ Error verificando email único:', emailCheckError);
      throw new Error('Error verificando la unicidad del email');
    }
    
    if (existingEmails && existingEmails.length > 0) {
      console.error('❌ Email ya existe:', existingEmails);
      throw new Error(`El email '${usuarioData.email}' ya está en uso por: ${existingEmails[0].primer_nombre} ${existingEmails[0].primer_apellido} (ID: ${existingEmails[0].id})`);
    }
    
    console.log('✅ Username y email únicos verificados para creación');
    
    // 1. Generar hash de la contraseña
    const { data: hashData, error: hashError } = await supabase.rpc('hash_password', {
      password_to_hash: password
    });
    
    if (hashError) {
      // Si no existe la función RPC, usar un hash simple
      const simpleHash = btoa(password); // Base64 encoding como fallback
      const userDataWithHash = {
        ...usuarioData,
        password_hash: simpleHash
      };
      
      const { data: newUser, error: userError } = await supabase
        .from('gen_usuarios')
        .insert(userDataWithHash)
        .select()
        .single();
      if (userError) throw userError;

      // 2. Asignar roles
      if (rolesIds.length > 0) {
        const rolesToInsert = rolesIds.map(rol_id => ({ usuario_id: newUser.id, rol_id }));
        await supabase.from('gen_usuario_roles').insert(rolesToInsert);
      }

      // 3. Asignar empresas
      if (empresaIds.length > 0) {
        const empresasToInsert = empresaIds.map(empresa_id => ({ usuario_id: newUser.id, empresa_id }));
        await supabase.from('gen_usuario_empresas').insert(empresasToInsert);
      }

      return newUser;
    } else {
      // Usar el hash generado por la función RPC
      const userDataWithHash = {
        ...usuarioData,
        password_hash: hashData
      };
      
      const { data: newUser, error: userError } = await supabase
        .from('gen_usuarios')
        .insert(userDataWithHash)
        .select()
        .single();
      if (userError) throw userError;

      // 2. Asignar roles
      if (rolesIds.length > 0) {
        const rolesToInsert = rolesIds.map(rol_id => ({ usuario_id: newUser.id, rol_id }));
        await supabase.from('gen_usuario_roles').insert(rolesToInsert);
      }

      // 3. Asignar empresas
      if (empresaIds.length > 0) {
        const empresasToInsert = empresaIds.map(empresa_id => ({ usuario_id: newUser.id, empresa_id }));
        await supabase.from('gen_usuario_empresas').insert(empresasToInsert);
      }

      return newUser;
    }
  },

  // Actualizar un usuario y sus relaciones
  async updateUsuario(id: number, usuarioData: Partial<UsuarioData>, rolesIds: number[], empresaIds: number[], password?: string) {
    console.log("🔄 usuariosService: updateUsuario llamado con:", { id, usuarioData, rolesIds, empresaIds, hasPassword: !!password });
    console.log("🔄 CONFIRMACIÓN: Estamos en updateUsuario, NO en createUsuario");
    
    // Validar username único si se está actualizando
    if (usuarioData.username) {
      console.log(`🔍 Validando username único: "${usuarioData.username}" para usuario ID: ${id}`);
      
      const { data: existingUsers, error: checkError } = await supabase
        .from('gen_usuarios')
        .select('id, username, primer_nombre, primer_apellido')
        .eq('username', usuarioData.username)
        .neq('id', id);
      
      console.log('📊 Resultado verificación username:', { existingUsers, checkError });
      
      if (checkError) {
        console.error('❌ Error verificando username único:', checkError);
        throw new Error('Error verificando la unicidad del username');
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.error('❌ Username duplicado encontrado:', existingUsers);
        throw new Error(`El username '${usuarioData.username}' ya está en uso por otro usuario: ${existingUsers[0].primer_nombre} ${existingUsers[0].primer_apellido} (ID: ${existingUsers[0].id})`);
      }
      
      console.log('✅ Username único verificado correctamente');
    }

    // Validar email único si se está actualizando
    if (usuarioData.email) {
      console.log(`🔍 Validando email único: "${usuarioData.email}" para usuario ID: ${id}`);
      
      const { data: existingEmails, error: emailCheckError } = await supabase
        .from('gen_usuarios')
        .select('id, email, primer_nombre, primer_apellido')
        .eq('email', usuarioData.email)
        .neq('id', id);
      
      console.log('📊 Resultado verificación email:', { existingEmails, emailCheckError });
      
      if (emailCheckError) {
        console.error('❌ Error verificando email único:', emailCheckError);
        throw new Error('Error verificando la unicidad del email');
      }
      
      if (existingEmails && existingEmails.length > 0) {
        console.error('❌ Email duplicado encontrado:', existingEmails);
        throw new Error(`El email '${usuarioData.email}' ya está en uso por otro usuario: ${existingEmails[0].primer_nombre} ${existingEmails[0].primer_apellido} (ID: ${existingEmails[0].id})`);
      }
      
      console.log('✅ Email único verificado correctamente');
    }
    
    let finalUsuarioData = { ...usuarioData };
    
    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.trim() !== '') {
      const { data: hashData, error: hashError } = await supabase.rpc('hash_password', {
        password_to_hash: password
      });
      
      if (hashError) {
        console.warn('No se pudo usar hash_password RPC, usando fallback:', hashError);
        // Fallback: usar base64
        finalUsuarioData.password_hash = btoa(password);
      } else {
        finalUsuarioData.password_hash = hashData;
      }
    }
    
    // 1. Actualizar datos del usuario
    console.log('📤 Enviando datos a Supabase:', { id, finalUsuarioData });
    
    const { data: updatedUser, error: userError } = await supabase
      .from('gen_usuarios')
      .update(finalUsuarioData)
      .eq('id', id)
      .select()
      .single();
      
    if (userError) {
      console.error('❌ Error actualizando usuario en BD:', userError);
      throw userError;
    }
    
    console.log('✅ Usuario actualizado exitosamente:', updatedUser);

    // 2. Actualizar roles (eliminar antiguos y añadir nuevos)
    await supabase.from('gen_usuario_roles').delete().eq('usuario_id', id);
    if (rolesIds.length > 0) {
      const rolesToInsert = rolesIds.map(rol_id => ({ usuario_id: id, rol_id }));
      await supabase.from('gen_usuario_roles').insert(rolesToInsert);
    }

    // 3. Actualizar empresas (eliminar antiguas y añadir nuevas)
    await supabase.from('gen_usuario_empresas').delete().eq('usuario_id', id);
    if (empresaIds.length > 0) {
      const empresasToInsert = empresaIds.map(empresa_id => ({ usuario_id: id, empresa_id }));
      await supabase.from('gen_usuario_empresas').insert(empresasToInsert);
    }

    return updatedUser;
  },

  // Inactivar un usuario
  async deactivateUsuario(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
    return data;
  },
  
  // Activar un usuario
  async activateUsuario(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update({ activo: true })
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Eliminar un usuario permanentemente
  async deleteUsuarioPermanent(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // Actualizar último acceso del usuario
  async updateUltimoAcceso(id: number) {
    const { data, error } = await supabase
      .from('gen_usuarios')
      .update({ 
        ultimo_acceso: new Date().toISOString() 
      })
      .eq('id', id)
      .select('ultimo_acceso')
      .single();
    
    if (error) throw error;
    return data;
  }
}; 