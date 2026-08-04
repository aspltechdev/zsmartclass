// src/pages/admin/AdminSettings.jsx
import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Mail,
  CreditCard,
  Shield,
  Bell,
  Database,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import "./AdminSettings.css";

function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageType, setSaveMessageType] = useState("");

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "ZSmartClass",
    siteEmail: "",
    sitePhone: "",
    address: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    maintenanceMode: false,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    mailHost: "",
    mailPort: "587",
    mailUsername: "",
    mailPassword: "",
    mailFromAddress: "",
    mailFromName: "",
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    currency: "INR",
    taxRate: "18",
    enableTax: true,
    enableCoupons: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: "60",
    maxLoginAttempts: "5",
  });

  // Module Settings
  const [moduleSettings, setModuleSettings] = useState({
    enableCourses: true,
    enableEnrollments: true,
    enableCertificates: true,
    enableReviews: true,
    enablePayments: true,
    enableNotifications: true,
  });

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "email", label: "Email", icon: Mail },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
    { id: "modules", label: "Modules", icon: Database },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const res = await api.get("/settings");
      const data = res.data?.data || res.data;

      if (data.general) setGeneralSettings(data.general);
      if (data.email) setEmailSettings(data.email);
      if (data.payment) setPaymentSettings(data.payment);
      if (data.security) setSecuritySettings(data.security);
      if (data.modules) setModuleSettings(data.modules);
    } catch (err) {
      console.error("Error loading settings:", err);
      setLoadError(
        err.response?.data?.message || "Couldn't load settings from the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Save settings — this is the only place settings get persisted.
  // No silent localStorage fallback: if the save fails, the user is
  // told it failed, not shown a false "saved" message.
  const saveSettings = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const payload = {
        general: generalSettings,
        email: emailSettings,
        payment: paymentSettings,
        security: securitySettings,
        modules: moduleSettings,
      };

      const res = await api.put("/settings", payload);
      const data = res.data?.data || res.data;

      // Reflect the server's merged/normalized copy back into the form,
      // so the UI always shows exactly what's actually persisted.
      if (data?.general) setGeneralSettings(data.general);
      if (data?.email) setEmailSettings(data.email);
      if (data?.payment) setPaymentSettings(data.payment);
      if (data?.security) setSecuritySettings(data.security);
      if (data?.modules) setModuleSettings(data.modules);

      setSaveMessage("Settings saved successfully.");
      setSaveMessageType("success");
    } catch (err) {
      console.error("Error saving settings:", err);
      setSaveMessage(err.response?.data?.message || "Failed to save settings.");
      setSaveMessageType("error");
    } finally {
      setSaving(false);
      setTimeout(() => {
        setSaveMessage("");
        setSaveMessageType("");
      }, 3000);
    }
  };

  // Reset only clears the form back to defaults locally — it does NOT
  // persist anything. The user still has to hit "Save Settings" to
  // actually apply it, same as any other edit.
  const resetSettings = () => {
    if (!window.confirm("Reset all fields to default values? This won't save until you click Save Settings.")) return;

    setGeneralSettings({
      siteName: "ZsmartClass",
      siteEmail: "",
      sitePhone: "",
      address: "",
      timezone: "Asia/Kolkata",
      currency: "INR",
      maintenanceMode: false,
    });

    setEmailSettings({
      mailHost: "",
      mailPort: "587",
      mailUsername: "",
      mailPassword: "",
      mailFromAddress: "",
      mailFromName: "",
    });

    setPaymentSettings({
      currency: "INR",
      taxRate: "18",
      enableTax: true,
      enableCoupons: true,
    });

    setSecuritySettings({
      sessionTimeout: "60",
      maxLoginAttempts: "5",
    });

    setModuleSettings({
      enableCourses: true,
      enableEnrollments: true,
      enableCertificates: true,
      enableReviews: true,
      enablePayments: true,
      enableNotifications: true,
    });
  };

  // Export settings
  const exportSettings = () => {
    const payload = {
      general: generalSettings,
      email: emailSettings,
      payment: paymentSettings,
      security: securitySettings,
      modules: moduleSettings,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `settings-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Import settings — loads a previously-exported JSON file into the
  // form only. Nothing is persisted until Save Settings is clicked.
  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        
        if (settings.general) setGeneralSettings(settings.general);
        if (settings.email) setEmailSettings(settings.email);
        if (settings.payment) setPaymentSettings(settings.payment);
        if (settings.security) setSecuritySettings(settings.security);
        if (settings.modules) setModuleSettings(settings.modules);
        
        setSaveMessage("Settings imported — click Save Settings to apply them.");
        setSaveMessageType("success");
        
        setTimeout(() => {
          setSaveMessage("");
          setSaveMessageType("");
        }, 4000);
      } catch (err) {
        setSaveMessage("Invalid settings file");
        setSaveMessageType("error");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="settings-page">
        <div className="loading-state">
          <AlertCircle size={32} color="#ef4444" />
          <p>{loadError}</p>
          <button className="add-btn" onClick={fetchSettings} style={{ marginTop: '12px' }}>
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">Manage your platform configuration</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchSettings} title="Refresh settings">
            <RefreshCw size={18} />
          </button>
          <button className="add-btn secondary" onClick={exportSettings} title="Export settings">
            <Download size={18} />
          </button>
          <label className="add-btn secondary" style={{ cursor: 'pointer' }}>
            <Upload size={18} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </label>
          <button className="add-btn secondary" onClick={resetSettings} style={{ background: '#ef4444' }}>
            <Trash2 size={18} />
            Reset
          </button>
          <button className="add-btn" onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <div className="spinner-small"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`save-message ${saveMessageType}`}>
          {saveMessageType === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="settings-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="settings-panel">
            <h3>General Settings</h3>
            <p className="panel-description">Basic platform information and configuration</p>
            <div className="settings-grid">
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={generalSettings.siteName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                  }
                  placeholder="ZSmartClass"
                />
              </div>

              <div className="form-group">
                <label>Site Email</label>
                <input
                  type="email"
                  value={generalSettings.siteEmail}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, siteEmail: e.target.value })
                  }
                  placeholder="admin@zsmartclass.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={generalSettings.sitePhone}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, sitePhone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={generalSettings.address}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              </div>

              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={generalSettings.timezone}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, timezone: e.target.value })
                  }
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                  <option value="Pacific/Auckland">Pacific/Auckland</option>
                </select>
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  value={generalSettings.currency}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, currency: e.target.value })
                  }
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={generalSettings.maintenanceMode}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })
                    }
                  />
                  <span>Maintenance Mode</span>
                </label>
                <span className="field-hint">Enable to put the site under maintenance</span>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === "email" && (
          <div className="settings-panel">
            <h3>Email Settings</h3>
            <p className="panel-description">Configure email delivery for notifications</p>
            <div className="settings-grid">
              <div className="form-group">
                <label>Mail Host</label>
                <input
                  type="text"
                  value={emailSettings.mailHost}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, mailHost: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="form-group">
                <label>Mail Port</label>
                <input
                  type="text"
                  value={emailSettings.mailPort}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, mailPort: e.target.value })
                  }
                  placeholder="587"
                />
              </div>

              <div className="form-group">
                <label>Mail Username</label>
                <input
                  type="text"
                  value={emailSettings.mailUsername}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, mailUsername: e.target.value })
                  }
                  placeholder="username@example.com"
                />
              </div>

              <div className="form-group">
                <label>Mail Password</label>
                <input
                  type="password"
                  value={emailSettings.mailPassword}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, mailPassword: e.target.value })
                  }
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label>From Address</label>
                <input
                  type="email"
                  value={emailSettings.mailFromAddress}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, mailFromAddress: e.target.value })
                  }
                  placeholder="noreply@zsmartclass.com"
                />
              </div>

              <div className="form-group">
                <label>From Name</label>
                <input
                  type="text"
                  value={emailSettings.mailFromName}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, mailFromName: e.target.value })
                  }
                  placeholder="ZSmartClass"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === "payment" && (
          <div className="settings-panel">
            <h3>Payment Settings</h3>
            <p className="panel-description">Configure payment gateway and tax settings</p>
            <div className="settings-grid">
              <div className="form-group">
                <label>Currency</label>
                <select
                  value={paymentSettings.currency}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, currency: e.target.value })
                  }
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={paymentSettings.taxRate}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, taxRate: e.target.value })
                  }
                  placeholder="18"
                />
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={paymentSettings.enableTax}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, enableTax: e.target.checked })
                    }
                  />
                  <span>Enable Tax</span>
                </label>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={paymentSettings.enableCoupons}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, enableCoupons: e.target.checked })
                    }
                  />
                  <span>Enable Coupons / Discounts</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="settings-panel">
            <h3>Security Settings</h3>
            <p className="panel-description">Configure security and session settings</p>
            <div className="settings-grid">
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })
                  }
                  placeholder="60"
                />
                <span className="field-hint">Auto logout after inactivity</span>
              </div>

              <div className="form-group">
                <label>Max Login Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })
                  }
                  placeholder="5"
                />
                <span className="field-hint">Lock account after failed attempts</span>
              </div>
            </div>
          </div>
        )}

        {/* Module Settings */}
        {activeTab === "modules" && (
          <div className="settings-panel">
            <h3>Module Settings</h3>
            <p className="panel-description">Enable or disable platform features</p>
            <div className="modules-grid">
              <div className="module-card">
                <div className="module-info">
                  <h4>📚 Courses</h4>
                  <span>Manage and create courses</span>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={moduleSettings.enableCourses}
                    onChange={(e) =>
                      setModuleSettings({ ...moduleSettings, enableCourses: e.target.checked })
                    }
                  />
                </label>
              </div>

              <div className="module-card">
                <div className="module-info">
                  <h4>👨‍🎓 Enrollments</h4>
                  <span>Student enrollments</span>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={moduleSettings.enableEnrollments}
                    onChange={(e) =>
                      setModuleSettings({ ...moduleSettings, enableEnrollments: e.target.checked })
                    }
                  />
                </label>
              </div>

              <div className="module-card">
                <div className="module-info">
                  <h4>🏆 Certificates</h4>
                  <span>Certificate generation</span>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={moduleSettings.enableCertificates}
                    onChange={(e) =>
                      setModuleSettings({ ...moduleSettings, enableCertificates: e.target.checked })
                    }
                  />
                </label>
              </div>

              <div className="module-card">
                <div className="module-info">
                  <h4>⭐ Reviews</h4>
                  <span>Student reviews and ratings</span>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={moduleSettings.enableReviews}
                    onChange={(e) =>
                      setModuleSettings({ ...moduleSettings, enableReviews: e.target.checked })
                    }
                  />
                </label>
              </div>

              <div className="module-card">
                <div className="module-info">
                  <h4>💰 Payments</h4>
                  <span>Payment processing</span>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={moduleSettings.enablePayments}
                    onChange={(e) =>
                      setModuleSettings({ ...moduleSettings, enablePayments: e.target.checked })
                    }
                  />
                </label>
              </div>

              <div className="module-card">
                <div className="module-info">
                  <h4>🔔 Notifications</h4>
                  <span>System notifications</span>
                </div>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={moduleSettings.enableNotifications}
                    onChange={(e) =>
                      setModuleSettings({ ...moduleSettings, enableNotifications: e.target.checked })
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSettings;