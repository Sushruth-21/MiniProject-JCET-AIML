import React, { useState, useEffect, memo, useRef } from 'react';
import axios from 'axios';
import PrincipalDashboard from './components/PrincipalDashboard';
import HODDashboard from './components/HODDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';
import AnnouncementsPage from './components/AnnouncementsPage';
import Dashboard from './components/Dashboard';
import EmployeesView from './components/EmployeesView';
import LeaveRequestManagement from './components/LeaveRequestManagement';
import AttendanceSystem from './components/AttendanceSystem';
import LeaveRequestPage from './components/LeaveRequestPage';
import AdminAttendanceHistory from './components/AdminAttendanceHistory';
import EmployeeManagementView from './components/EmployeeManagementView';
import { Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import RegistrationPage from './components/RegistrationPage';
import HODEmployeeRegistration from './components/HODEmployeeRegistration';
import DepartmentManagement from './components/DepartmentManagement';
import { withRoleProtection } from './components/ProtectedComponent';
const ProtectedHODEmployeeRegistration = withRoleProtection(HODEmployeeRegistration, ['admin', 'HOD']);
const MemoizedHODEmployeeRegistration = memo(ProtectedHODEmployeeRegistration);
const ProtectedDepartmentManagement = withRoleProtection(DepartmentManagement, ['admin']);
const MemoizedDepartmentManagement = memo(ProtectedDepartmentManagement);
const ProtectedAdminAttendanceHistory = withRoleProtection(AdminAttendanceHistory, ['admin']);
const MemoizedAdminAttendanceHistory = memo(ProtectedAdminAttendanceHistory);
const ProtectedEmployeeManagementView = withRoleProtection(EmployeeManagementView, ['admin']);
const MemoizedEmployeeManagementView = memo(ProtectedEmployeeManagementView);

// Protected and memoized dashboard components
const ProtectedAdminDashboard = withRoleProtection(AdminDashboard, ['admin']);
const MemoizedAdminDashboard = memo(ProtectedAdminDashboard);

const ProtectedHODDashboard = withRoleProtection(HODDashboard, ['HOD', 'admin'], 'selectedHodId');
const MemoizedHODDashboard = memo(ProtectedHODDashboard);

const ProtectedPrincipalDashboard = withRoleProtection(PrincipalDashboard, ['principal', 'admin'], 'selectedPrincipalId');
const MemoizedPrincipalDashboard = memo(ProtectedPrincipalDashboard);

const ProtectedEmployeeDashboard = withRoleProtection(EmployeeDashboard, ['employee']);
const MemoizedEmployeeDashboard = memo(ProtectedEmployeeDashboard);

// Other memoized components
const MemoizedAnnouncementsPage = memo(AnnouncementsPage);
const MemoizedLeaveRequestManagement = memo(LeaveRequestManagement);
const MemoizedAttendanceSystem = memo(AttendanceSystem);
const MemoizedLeaveRequestPage = memo(LeaveRequestPage);

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [role, setRole] = useState(localStorage.getItem('userRole') || '');
  const [loggedInUsername, setLoggedInUsername] = useState(localStorage.getItem('username') || '');
  const [loggedInName, setLoggedInName] = useState(localStorage.getItem('name') || '');
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState(localStorage.getItem('employeeId') || '');
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Theme state and toggle function
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Effect for dynamic sidebar (optimized to prevent flickering)
  useEffect(() => {
    // Only apply if a role is present (user is logged in)
    if (role) {
      let activityTimeout;
      
      const handleActivity = () => {
        clearTimeout(activityTimeout);
        if (!showSidebar) {
          setShowSidebar(true);
        }
        activityTimeout = setTimeout(() => {
          setShowSidebar(false);
        }, 8000); // Increased to 8 seconds of inactivity
      };

      // Throttled activity handler to prevent excessive calls
      let lastCall = 0;
      const throttledHandler = () => {
        const now = Date.now();
        if (now - lastCall > 100) { // Throttle to every 100ms
          lastCall = now;
          handleActivity();
        }
      };

      document.addEventListener('mousemove', throttledHandler);
      document.addEventListener('keydown', throttledHandler);
      
      // Set initial state - always show sidebar when logged in
      setShowSidebar(true);
      
      // Set initial timeout
      activityTimeout = setTimeout(() => {
        setShowSidebar(false);
      }, 8000);

      return () => {
        clearTimeout(activityTimeout);
        document.removeEventListener('mousemove', throttledHandler);
        document.removeEventListener('keydown', throttledHandler);
      };
    }
  }, [role]); // Remove showSidebar dependency to prevent re-renders

  // Separate effect for showSidebar state changes
  useEffect(() => {
    if (!role) {
      setShowSidebar(true); // Always show sidebar on login/registration page
    }
  }, [role]);

  // Auto-logout on window/tab close
  useEffect(() => {
    if (role) {
      const handleBeforeUnload = () => {
        // Use sendBeacon for reliable delivery even during page unload
        const logoutData = new FormData();
        navigator.sendBeacon('/api/logout/', logoutData);
        
        // Also clear localStorage immediately
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('name');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [role]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };




  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage('');
    try {
      const response = await axios.post('/api/login/', { username, password });
      setLoginMessage(response.data.message);
      setRole(response.data.role);
      setLoggedInUsername(response.data.username);
      setLoggedInName(response.data.name);
      setLoggedInEmployeeId(response.data.employee_id || '');
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('name', response.data.name);
      localStorage.setItem('employeeId', response.data.employee_id || '');

      // Clear any role-switching IDs when logging in fresh
      if (response.data.role === 'HOD') {
        // HOD should never have admin-level role switching IDs
        localStorage.removeItem('selectedPrincipalId');
        console.log('[Login] HOD login - cleared selectedPrincipalId');
      } else if (response.data.role === 'employee') {
        // Employee should never have admin-level role switching IDs
        localStorage.removeItem('selectedPrincipalId');
        localStorage.removeItem('selectedHodId');
        console.log('[Login] Employee login - cleared admin IDs');
      }

      // Redirect based on role
      if (response.data.role === 'admin') {
        navigate('/admin'); // Redirect admin to admin role selection
      } else if (response.data.role === 'HOD') {
        navigate('/hod');
      } else if (response.data.role === 'employee') {
        navigate('/employee');
      }

    } catch (error) {
      setLoginMessage(error.response?.data?.error || 'Login failed.');
      setRole('');
      setLoggedInUsername('');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    setRole('');
    setLoggedInUsername('');
    setLoggedInName('');
    setLoggedInEmployeeId('');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('employeeId');
    navigate('/');
  };

  if (!role) {
    return (
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="login-form-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--color-text)', marginBottom: '30px', fontSize: '2.5em' }}>HRMS Login</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: 'calc(100% - 24px)', // Account for padding
                padding: '12px',
                border: '1px solid var(--color-link)',
                borderRadius: '8px',
                background: 'var(--color-button-bg)',
                color: 'var(--color-text)',
                fontSize: '1em'
              }}
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: 'calc(100% - 24px)', // Account for padding
                padding: '12px',
                border: '1px solid var(--color-link)',
                borderRadius: '8px',
                background: 'var(--color-button-bg)',
                color: 'var(--color-text)',
                fontSize: '1em'
              }}
            />
          </div>
          <button type="submit" style={{
            padding: '12px 20px',
            backgroundColor: 'var(--color-link)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: '600',
            transition: 'background-color 0.25s',
            alignSelf: 'stretch' // Ensure button stretches
          }}>Login</button>
        </form>
        {loginMessage && (
          <p style={{
            marginTop: '25px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: loginMessage.includes('failed') ? 'rgba(248, 215, 218, 0.8)' : 'rgba(212, 237, 218, 0.8)',
            color: loginMessage.includes('failed') ? '#721c24' : '#155724',
            border: loginMessage.includes('failed') ? '1px solid rgba(245, 198, 203, 0.8)' : '1px solid rgba(195, 230, 203, 0.8)',
            width: '100%',
            textAlign: 'center'
          }}>
            {loginMessage}
          </p>
        )}
        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)', fontSize: '0.9em' }}>
          **Note:** Default logins are `admin/admin` for Admin and `employee/employee` for Employee.
        </p>

        <button
          onClick={toggleTheme}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '10px 15px',
            backgroundColor: theme === 'light' ? '#6c757d' : '#495057',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9em',
            transition: 'background-color 0.2s',
          }}
        >
          Toggle to {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>
    </div>
    );
  }

  // --- Main Application Layout with Ribbon and Sidebar ---
  // Check if we're on admin dashboard role selection (no sidebar should show)
  const isAdminRoleSelection = role === 'admin' && location.pathname === '/admin';
  
  return (
    <div className="app-container">
      <>
      {/* Sidebar - Hide on admin role selection */}
      {!isAdminRoleSelection && (
      <>
        {/* Hover trigger area for hidden sidebar */}
        {!showSidebar && role && (
          <div 
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '60px',
              height: '100vh',
              backgroundColor: 'transparent',
              zIndex: 999,
              cursor: 'pointer'
            }}
            onMouseEnter={() => setShowSidebar(true)}
          />
        )}
        <div className={`sidebar ${!showSidebar && role ? 'sidebar-hidden' : ''}`}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--color-sidebar-text)', fontSize: '1.8em' }}>HRMS</h2>
        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9em', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px' }}>Logged in as: <br/><strong>{loggedInName} ({role})</strong></p>
        <ul style={{ listStyleType: 'none', padding: 0, flexGrow: 1 }}>
          {role === 'admin' && (
            <>
              <li style={{ marginBottom: '10px' }}><Link to="/admin" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Admin Dashboard</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/hod" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>HOD Operations</Link></li>
              {!localStorage.getItem('selectedHodId') || localStorage.getItem('selectedPrincipalId') ? (
                <li style={{ marginBottom: '10px' }}><Link to="/principal" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Principal Operations</Link></li>
              ) : null}
              <li style={{ marginBottom: '10px' }}><Link to="/attendance-history" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Attendance History</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/departments" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>🏢 Departments</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/leave-management" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Leave Management</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/employee-management" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>👥 Employee Management</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/announcements" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Announcements</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Overall Dashboard</Link></li>
            </>
          )}
          {role === 'HOD' && (
            <>
              <li style={{ marginBottom: '10px' }}><Link to="/hod" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>HOD Dashboard</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/register-employee" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>👥 Register Employee</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/leave-management" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Leave Management</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/announcements" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Announcements</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Overall Dashboard</Link></li>
            </>
          )}
          {role === 'employee' && (
            <>
              <li style={{ marginBottom: '10px' }}><Link to="/employee" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Employee Dashboard</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/attendance" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Mark Attendance</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/leave-request" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Leave Request</Link></li>
              <li style={{ marginBottom: '10px' }}><Link to="/announcements" style={{ textDecoration: 'none', color: 'var(--color-sidebar-text)', display: 'block', padding: '10px 15px', borderRadius: '5px', transition: 'background-color 0.2s', backgroundColor: 'transparent' }}>Announcements</Link></li>
            </>
          )}
        </ul>
        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '12px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em', marginTop: '20px', transition: 'background-color 0.2s' }}
        >
          Logout
        </button>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            width: '100%',
            padding: '12px 15px',
            backgroundColor: theme === 'light' ? '#6c757d' : '#495057',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1em',
            marginTop: '10px',
            transition: 'background-color 0.2s',
          }}
        >
          Toggle to {theme === 'light' ? 'Dark' : 'Light'} Mode
</button>
          </div>
         </>
         )}
        
        {/* Main Content Area */}
        <div className="main-content-area">
            <Routes>
              <Route path="/admin" element={<MemoizedAdminDashboard username={loggedInUsername} />} />
              <Route path="/hod" element={<MemoizedHODDashboard username={loggedInUsername} />} />
              <Route path="/principal" element={<MemoizedPrincipalDashboard username={loggedInUsername} />} />
              <Route path="/employee" element={<MemoizedEmployeeDashboard username={loggedInUsername} employeeId={loggedInEmployeeId} />} />
              <Route path="/departments" element={<MemoizedDepartmentManagement />} />
              <Route path="/register-employee" element={<MemoizedHODEmployeeRegistration />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/announcements" element={<MemoizedAnnouncementsPage username={loggedInUsername} role={role} />} />
              <Route path="/dashboard" element={<MemoizedAdminDashboard />} />
              <Route path="/attendance-history" element={<MemoizedAdminAttendanceHistory />} />
              <Route path="/leave-management" element={<MemoizedLeaveRequestManagement />} />
              <Route path="/attendance" element={<MemoizedAttendanceSystem username={loggedInUsername} employeeId={loggedInEmployeeId} />} />
              <Route path="/leave-request" element={<MemoizedLeaveRequestPage username={loggedInUsername} employeeId={loggedInEmployeeId} />} />
              <Route path="/employee-management" element={<MemoizedEmployeeManagementView />} />
              <Route path="/" element={
                <h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--color-text)' }}>Select an option from the sidebar to get started.</h2>
              } />
             </Routes>
</div>
      </>
      </div>
      );
}


export default App;