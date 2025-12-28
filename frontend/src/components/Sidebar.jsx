// Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Note: We can't reliably check if user is owner from the user object
// because supplier_role is not included in /users/me response.
// The Users page will handle access control by checking the API endpoint.

const styles = {
  wrap: {
    width: 240,
    padding: 16,
    borderRight: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    gap: 15,
    background: "#f8f9fb",
  },
  title: { margin: 0, fontSize: 22 },
  nav: { display: "flex", flexDirection: "column", gap: 6, marginTop: 8 },
  linkBase: {
    display: "block",
    padding: "10px 12px",
    textDecoration: "none",
    color: "#334155",
    borderRadius: 10,
    fontWeight: 500,
  },
  linkActive: {
    background: "#e6f0ff",
    color: "#1d4ed8",
    boxShadow: "inset 0 0 0 1px rgba(29,78,216,.25)",
  },
  linkHover: {
    background: "#f1f5f9",
  },
  footer: { marginTop: "auto" },
  logoutBtn: {
    marginBottom: 60,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
  },
};

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...styles.linkBase,
        ...(isActive ? styles.linkActive : null),
      })}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.linkHover)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.linkBase)}
    >
      {children}
    </NavLink>
  );
}

export default function Sidebar() {
  const { logout, isManager, isSales, isOwner, isLoading: roleLoading } = useAuth();

  return (
    <aside style={styles.wrap}>
      <h3 style={styles.title}>Supplier Portal</h3>

      <nav style={styles.nav}>
        <NavItem to="/dashboard">Dashboard</NavItem>
        {(isManager || isSales) && <NavItem to="/catalog">Catalog</NavItem>}
        <NavItem to="/orders">Orders</NavItem>
        <NavItem to="/complaints">Complaints</NavItem>
        {(isManager || isSales) && <NavItem to="/consumers">Consumers</NavItem>}
        {isOwner && <NavItem to="/users">User Management</NavItem>}
        <NavItem to="/settings">Settings</NavItem>
      </nav>

      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn}>Log out</button>
      </div>
    </aside>
  );
}
