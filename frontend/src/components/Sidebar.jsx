import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/sidebar.css";

const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/trainees", label: "Trainee Registry" },
  { to: "/placements", label: "Placements & Outcomes" },
  { to: "/followups", label: "Follow-up Queue" },
  { to: "/analytics", label: "Analytics" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">Skilling Outcomes<br />Tracker</div>
        <div className="brand-sub">Longitudinal impact measurement</div>
      </div>
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>{user.name}</div>
            <div style={{ textTransform: "capitalize", marginBottom: 8 }}>{user.role?.replaceAll("_", " ")}</div>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", padding: "5px 10px", fontSize: "0.76rem" }}
            >
              Sign out
            </button>
          </div>
        )}
        Consent-based data collection.<br />
        Records auditable per DPDP Act, 2023.
      </div>
    </aside>
  );
}
