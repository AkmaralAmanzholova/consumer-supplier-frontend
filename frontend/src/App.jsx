import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import Complaints from "./pages/Complaints";
import Consumers from "./pages/Consumers";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex", minHeight: "100vh" }}>
                  <Sidebar />
                  <div style={{ padding: 20, flexGrow: 1, minHeight: "100vh" }}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/catalog" element={<Catalog />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/complaints" element={<Complaints />} />
                      <Route path="/consumers" element={<Consumers />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Dashboard />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
