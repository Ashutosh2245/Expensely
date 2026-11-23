import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  loginWithGoogle: (data: { email: string; name: string; googleId?: string; picture?: string }) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('expensely_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('expensely_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('expensely_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authApi.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('expensely_user', JSON.stringify(data.user));
          getSocket(); // Initialize realtime socket
        }
      } catch (err) {
        console.warn('Session verification expired or failed');
        localStorage.removeItem('expensely_token');
        localStorage.removeItem('expensely_refresh_token');
        localStorage.removeItem('expensely_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const { data } = await authApi.login({ identifier, password });
      if (data.success) {
        localStorage.setItem('expensely_token', data.accessToken);
        localStorage.setItem('expensely_refresh_token', data.refreshToken);
        localStorage.setItem('expensely_user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
        getSocket();
        toast.success(`Welcome back, ${data.user.fullName}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
      return false;
    }
  };

  const loginWithGoogle = async (googleData: { email: string; name: string; googleId?: string; picture?: string }): Promise<boolean> => {
    try {
      const { data } = await authApi.googleAuth(googleData);
      if (data.success) {
        localStorage.setItem('expensely_token', data.accessToken);
        localStorage.setItem('expensely_refresh_token', data.refreshToken);
        localStorage.setItem('expensely_user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
        getSocket();
        toast.success(`Welcome, ${data.user.fullName}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
      return false;
    }
  };

  const register = async (formData: any): Promise<boolean> => {
    try {
      const { data } = await authApi.register(formData);
      if (data.success) {
        localStorage.setItem('expensely_token', data.accessToken);
        localStorage.setItem('expensely_refresh_token', data.refreshToken);
        localStorage.setItem('expensely_user', JSON.stringify(data.user));
        setToken(data.accessToken);
        setUser(data.user);
        getSocket();
        toast.success('Registration successful! Welcome to EXPENSELY.');
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('expensely_refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {});
      }
    } finally {
      localStorage.removeItem('expensely_token');
      localStorage.removeItem('expensely_refresh_token');
      localStorage.removeItem('expensely_user');
      setUser(null);
      setToken(null);
      disconnectSocket();
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('expensely_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
