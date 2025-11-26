import { createContext } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  google_id: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);