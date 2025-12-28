import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, token } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    
    if (savedUser && savedToken && !user) {
      setIsChecking(false);
    } else {
      setIsChecking(false);
    }
  }, [user, token]);

  if (isChecking) {
    return <div style={{ padding: 24 }}>Checking session…</div>;
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
