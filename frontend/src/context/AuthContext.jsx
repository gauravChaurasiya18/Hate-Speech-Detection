import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accountStats, setAccountStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await authService.me();
      setUser(data.user);
      setAccountStats(data.stats);
    } catch {
      setUser(null);
      setAccountStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const signIn = async (payload) => {
    const data = await authService.login(payload);
    setUser(data.user);
    await refresh();
    return data;
  };

  const register = async (payload) => {
    const data = await authService.signup(payload);
    setUser(data.user);
    await refresh();
    return data;
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setAccountStats(null);
  };

  const value = useMemo(
    () => ({ user, accountStats, loading, signIn, register, signOut, refresh }),
    [user, accountStats, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

