// src/components/student/StudentLayout.jsx
import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";
import { useAuth } from "../../context/AuthContext";
import "../admin/admin-theme.css"; // shared design tokens (--admin-*)
import "./StudentLayout.css";

const MOBILE_BREAKPOINT = 900;

const StudentLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((v) => !v),
    []
  );
  const toggleMobileSidebar = useCallback(
    () => setMobileSidebarOpen((v) => !v),
    []
  );
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  const handleLogout = useCallback(() => {
    // Use the auth context so in-memory state is cleared too — clearing
    // localStorage alone leaves the app thinking the user is still signed in.
    if (typeof logout === "function") {
      logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Close the drawer when resizing up to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setMobileSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Escape closes the drawer
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileSidebarOpen]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="student-layout">
      <StudentSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
        onLogout={handleLogout}
      />

      <div className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <StudentHeader
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onToggleMobile={toggleMobileSidebar}
          onLogout={handleLogout}
        />

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {mobileSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default StudentLayout;