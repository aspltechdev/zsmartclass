import React, { useState, useEffect } from 'react';
import { Menu, ChevronLeft, Bell, User, LogOut } from 'lucide-react';  // Removed Settings
import './StudentHeader.css';

const StudentHeader = ({ onMenuClick, onToggleSidebar, onLogout }) => {
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data');
      }
    }
  }, []);

  return (
    <header className="student-header">
      <div className="header-left">
        <button className="header-btn mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>

        <button className="header-btn toggle-sidebar-btn" onClick={onToggleSidebar}>
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="header-center">
        <h1 className="header-title">Dashboard</h1>
      </div>

      <div className="header-right">
        <button className="header-btn notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="profile-container">
          <button 
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className="profile-role">Student</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="dropdown-name">{user?.name || 'User'}</p>
                  <p className="dropdown-email">{user?.email || 'user@email.com'}</p>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-item" 
                onClick={() => {
                  setShowProfileMenu(false);
                  window.location.href = '/student/profile';
                }}
              >
                <User size={18} />
                Profile
              </button>

              {/* ❌ Settings option REMOVED */}

              <div className="dropdown-divider"></div>

              <button className="dropdown-item dropdown-logout" onClick={onLogout}>
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;