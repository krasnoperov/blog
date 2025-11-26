import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { AuthContext, type User } from './AuthContextProvider';

// Re-export types for backward compatibility
export type { User, AuthContextType } from './AuthContextProvider';

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json() as { user: User };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUser === undefined) {
      fetchUser();
    }
  }, [initialUser]);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: 'include'
      });
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}