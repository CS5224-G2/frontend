import React, { createContext, useState } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  role: 'user' | 'admin' | 'business' | null;
  login: (role?: 'user' | 'admin' | 'business') => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  role: null,
  login: () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'user' | 'admin' | 'business' | null>(null);

  const login = (newRole: 'user' | 'admin' | 'business' = 'user') => {
    setIsLoggedIn(true);
    setRole(newRole);
  };
  const logout = () => {
    setIsLoggedIn(false);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
