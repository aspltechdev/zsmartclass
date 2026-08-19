import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  TrendingUp,
  FileText,
  Award,
  Bell,
  CreditCard,
  User,
  Star,
  HelpCircle,
  LogOut,
  HelpCircle as QuizIcon,  // ← Add Quiz icon
} from 'lucide-react';
import './StudentSidebar.css';

const StudentSidebar = ({ collapsed, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/my-courses', icon: GraduationCap, label: 'My Learning' },
    { path: '/student/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/student/quiz', icon: QuizIcon, label: 'Quiz' },  // ← ADD QUIZ
    { path: '/student/assignments', icon: FileText, label: 'Assignments' },
    { path: '/student/certificates', icon: Award, label: 'Certificates' },
    { path: '/student/notifications', icon: Bell, label: 'Notifications' },
    { path: '/student/payments', icon: CreditCard, label: 'Payments' },
    { path: '/student/profile', icon: User, label: 'Profile' },
    { path: '/student/reviews', icon: Star, label: 'Reviews' },
    { path: '/student/support', icon: HelpCircle, label: 'Support' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <aside className={`student-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">Z</div>
          {!collapsed && <span className="logo-text">ZSmartClass</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (mobileOpen && onMobileClose) onMobileClose();
            }}
          >
            <item.icon size={20} className="nav-icon" />
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={20} className="nav-icon" />
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;