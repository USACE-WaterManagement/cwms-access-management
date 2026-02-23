import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextType {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (storedToken && storedUsername) {
      setToken(storedToken);
      setUsername(storedUsername);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      if (data.success && data.data !== undefined) {
        setToken(data.data.access_token);
        setUsername(data.data.username);
        localStorage.setItem('token', data.data.access_token);
        localStorage.setItem('username', data.data.username);
      } else {
        throw new Error(data.error || 'Login failed');
      }
    },
    [setToken, setUsername],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }, [setToken, setUsername]);

  const authenticated = useMemo(() => token !== null, [token]);

  const contextValue = useMemo(() => {
    return {
      token,
      username,
      login,
      logout,
      isAuthenticated: authenticated,
      isLoading,
    };
  }, [token, username, login, logout, authenticated, isLoading]);
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
