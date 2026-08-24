// src/components/mentor/MentorLayout.jsx
import { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MentorHeader from "./MentorHeader";
import MentorSidebar from "./MentorSidebar";
import "../admin/admin-theme.css"; // shared design tokens (--admin-*)
import "./MentorLayout.css";

const MOBILE_BREAKPOINT = 900;

function MentorLayout() {
  // Desktop: collapse the sidebar to an icon rail
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
    <div className="mentor-layout">
      <MentorSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={closeMobile}
      />

      {mobileOpen && (
        <div
          className="mentor-sidebar-backdrop"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <div className={`mentor-main ${collapsed ? "sidebar-closed" : "sidebar-open"}`}>
        <MentorHeader
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onToggleMobile={toggleMobile}
        />

        <div className="mentor-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MentorLayout;