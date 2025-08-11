import { supabase } from '../supabase';

interface User {
  usuario_id: number;
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  created_at?: string;
  updated_at?: string;
}

interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

interface RegisterResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Simple password hashing utility using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
  // Convert password to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Hash the password using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// Verify password against hash
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

export const userService = {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email y contraseña son requeridos' };
      }

      // Query user from database
      const { data, error } = await supabase
        .from('usuario')
        .select('usuario_id, email, nombre, telefono, direccion, contraseña, created_at, updated_at')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error) {
        // Check if user doesn't exist
        if (error.code === 'PGRST116') {
          return { success: false, error: 'El email ingresado no está registrado' };
        }
        console.error('Database error:', error);
        return { success: false, error: 'Error de conexión con la base de datos' };
      }

      if (!data) {
        return { success: false, error: 'El email ingresado no está registrado' };
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, data.contraseña);
      
      if (!isValidPassword) {
        return { success: false, error: 'La contraseña ingresada es incorrecta' };
      }

      // Return user data without password
      const user: User = {
        usuario_id: data.usuario_id,
        email: data.email,
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return {
        success: true,
        user,
        token: 'authenticated', // Simple token for now
      };
    } catch (error) {
      console.error('Login service error:', error);
      return { success: false, error: 'Error de conexión con la base de datos' };
    }
  },

  /**
   * Register new user
   */
  async register(email: string, password: string, nombre: string, telefono?: string, direccion?: string): Promise<RegisterResult> {
    try {
      if (!email || !password || !nombre) {
        return { success: false, error: 'Todos los campos son requeridos' };
      }

      if (password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('usuario')
        .select('usuario_id')
        .eq('email', normalizedEmail)
        .single();

      if (existingUser) {
        return { success: false, error: 'Ya existe un usuario con este email' };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Insert new user
      const { data, error } = await supabase
        .from('usuario')
        .insert({
          email: normalizedEmail,
          nombre: nombre.trim(),
          telefono: telefono?.trim() || null,
          direccion: direccion?.trim() || null,
          contraseña: hashedPassword,
        })
        .select('usuario_id, email, nombre, telefono, direccion, created_at, updated_at')
        .single();

      if (error || !data) {
        console.error('Database insert error:', error);
        return { success: false, error: 'Error al crear la cuenta' };
      }

      const user: User = {
        usuario_id: data.usuario_id,
        email: data.email,
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return {
        success: true,
        user,
        token: 'authenticated',
      };
    } catch (error) {
      console.error('Register service error:', error);
      return { success: false, error: 'Error de conexión con la base de datos' };
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('usuario_id, email, nombre, created_at, updated_at')
        .eq('usuario_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        usuario_id: data.usuario_id,
        email: data.email,
        nombre: data.nombre,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateUser(userId: number, updates: { nombre?: string; email?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('usuario_id', userId)
        .select('usuario_id, email, nombre, created_at, updated_at')
        .single();

      if (error || !data) {
        return { success: false, error: 'Error al actualizar el perfil' };
      }

      const user: User = {
        usuario_id: data.usuario_id,
        email: data.email,
        nombre: data.nombre,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { success: true, user };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Error de conexión con la base de datos' };
    }
  },
};