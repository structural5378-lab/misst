import React, { createContext, useContext, useState, useEffect } from "react";

const MyBBAuthContext = createContext();

const STORAGE_KEY = "mybb_session";

export function MyBBAuthProvider({ children }) {
  const [mybbUser, setMybbUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // If session is missing new fields, force re-login
      if (parsed && (parsed.postcount === undefined || parsed.password === undefined || parsed.avatar === undefined)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const login = (user) => {
    setMybbUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  };

  const logout = () => {
    setMybbUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <MyBBAuthContext.Provider value={{ mybbUser, login, logout }}>
      {children}
    </MyBBAuthContext.Provider>
  );
}

export function useMyBBAuth() {
  const ctx = useContext(MyBBAuthContext);
  if (!ctx) throw new Error("useMyBBAuth must be used within MyBBAuthProvider");
  return ctx;
}