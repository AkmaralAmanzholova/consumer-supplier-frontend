import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRoleDetection } from "./useRoleDetection";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const login = async (email, password) => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";

    const body = new URLSearchParams();
    body.set("grant_type", "password");           
    body.set("username", email);    
    body.set("password", password);

    const res = await fetch(`${base}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      let msg = "Invalid credentials";
      try {
        const j = await res.json();
        if (j?.detail) msg = j.detail;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json(); 
    const accessToken = data?.access_token;
    if (!accessToken) throw new Error("No token returned from server");

    localStorage.setItem("token", accessToken);
    setToken(accessToken);

    const meRes = await fetch(`${base}/users/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meRes.ok) throw new Error("Failed to fetch current user");

    const userData = await meRes.json();
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Helper function to check if response is 401 and handle logout
  const handle401Error = (response) => {
    if (response.status === 401) {
      logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return true;
    }
    return false;
  };

  // Detect user role
  const roleDetection = useRoleDetection(token);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        handle401Error,
        ...roleDetection, // isOwner, isManager, isSales, isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
