import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: {
    id: string;
    name: string; // Production: 'Manager' | 'Reception' | 'Warehouse' | 'Accountant' | 'Mechanic'
                   // Dev/Testing: 'Admin' (offline testing, staging, version control)
    description?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (roleName: string) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('AuthContext: Starting login for', email);
    const { data } = await api.post('/auth/login', { email, password });
    console.log('AuthContext: Login response received', data);
    localStorage.setItem('token', data.token);
    console.log('AuthContext: Token saved');
    setUser(data.user);
    console.log('AuthContext: User state updated', data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isRole = (roleName: string): boolean => {
    return user?.role.name === roleName;
  };

  const hasPermission = (_resource: string, _action: string): boolean => {
    // Admin role: DEV/TESTING only with full privileges
    // Used for offline testing, version control, and beta/alpha staging
    // NOT a production role for Baron Car Rental business operations
    return user?.role.name === 'Admin';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
