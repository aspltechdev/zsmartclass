// src/components/admin/AdminLayout.jsx
import { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import "./admin-theme.css";
import "./AdminLayout.css";

const MOBILE_BREAKPOINT = 900;

function AdminLayout() {
  // Desktop: sidebar collapsed to an icon rail
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: sidebar shown as an overlay drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

  const toggleCollapse = useCallback(() => setCollapsed((v) => !v), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close the drawer when resizing up to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Escape closes the drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="admin-layout">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={closeMobile}
      />

      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <div className={`admin-main ${collapsed ? "sidebar-closed" : "sidebar-open"}`}>
        <AdminHeader
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onToggleMobile={toggleMobile}
        />

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;