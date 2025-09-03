import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// User interface based on the usuario table
interface User {
  usuario_id: number;
  email: string;
  nombre: string;
  telefono?: string;
  direccion?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, nombre: string, telefono?: string, direccion?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = user !== null;

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('auth-user');
        const storedToken = localStorage.getItem('auth-token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('auth-user');
        localStorage.removeItem('auth-token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Import the user service dynamically to avoid circular imports
      const { userService } = await import('@/lib/services/userService');
      const result = await userService.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('auth-user', JSON.stringify(result.user));
        localStorage.setItem('auth-token', result.token || 'authenticated');
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: result.error || 'Error de autenticación' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const register = async (email: string, password: string, nombre: string, telefono?: string, direccion?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Import the user service dynamically to avoid circular imports
      const { userService } = await import('@/lib/services/userService');
      const result = await userService.register(email, password, nombre, telefono, direccion);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('auth-user', JSON.stringify(result.user));
        localStorage.setItem('auth-token', result.token || 'authenticated');
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Error al crear la cuenta' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-token');
    // Also clear selected farm data
    localStorage.removeItem('selected-farm');
    // Redirect to home page (login page)
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};