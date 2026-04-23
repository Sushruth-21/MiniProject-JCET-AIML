import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ResizableBox from './ResizableBox';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [rolerId, setRolerId] = useState('');
  const [message, setMessage] = useState('');
  const [showIdInput, setShowIdInput] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalAnnouncements: 0,
    pendingLeaveRequests: 0,
    attendanceRate: 0,
    presentToday: 0,
    absentToday: 0,
    leaveToday: 0,
    departmentStats: [],
    leaveStats: {},
    attendanceHistory: [],
    tasks: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all necessary data
      const [employeesRes, departmentsRes, announcementsRes, leaveRes, attendanceRes, todosRes] = await Promise.all([
        axios.get('/api/employees/'),
        axios.get('/api/departments/'),
        axios.get('/api/announcements/'),
        axios.get('/api/leave-request/'),
        axios.get('/api/attendance/'),
        axios.get('/api/todos-json/')
      ]);

      const employees = employeesRes.data.employees || [];
      const departments = departmentsRes.data.departments || [];
      const announcements = announcementsRes.data.announcements || [];
      const leaveRequests = leaveRes.data.leave_requests || [];
      const attendanceData = attendanceRes.data.attendance || [];
      const todos = todosRes.data.todos || [];

      // Calculate statistics
      const totalEmployees = employees.length;
      const totalDepartments = departments.length;
      const totalAnnouncements = announcements.length;
      const pendingLeaveRequests = leaveRequests.filter(lr => lr.status === 'pending').length;
      
      // Calculate attendance statistics
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceData && attendanceData.length > 0 ? attendanceData.filter(a => a.date && a.date.startsWith(today)) : [];
      const presentToday = todayAttendance.filter(a => a.status === 'present').length;
      const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
      const leaveToday = todayAttendance.filter(a => a.status === 'leave').length;
      
      // Calculate attendance rate
      const totalAttendanceRecords = attendanceData.length;
      const presentRecords = attendanceData.filter(a => a.status === 'present').length;
      const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;

      // Calculate department statistics
      const departmentStats = departments.map(dept => {
        const deptEmployees = employees.filter(emp => emp.assigned_hod === dept.name || emp.assigned_hod === dept.id);
        return {
          name: dept.name,
          totalEmployees: deptEmployees.length,
          presentToday: deptEmployees.filter(emp => {
            const empAttendance = todayAttendance.find(a => a.employee_id === emp.employee_id);
            return empAttendance && empAttendance.status === 'present';
          }).length,
          absentToday: deptEmployees.filter(emp => {
            const empAttendance = todayAttendance.find(a => a.employee_id === emp.employee_id);
            return empAttendance && empAttendance.status === 'absent';
          }).length
        };
      });

      // Calculate leave statistics
      const leaveStats = {
        total: leaveRequests.length,
        approved: leaveRequests.filter(lr => lr.status === 'approved').length,
        pending: leaveRequests.filter(lr => lr.status === 'pending').length,
        rejected: leaveRequests.filter(lr => lr.status === 'rejected').length,
        byType: leaveRequests.reduce((acc, lr) => {
          acc[lr.leave_type] = (acc[lr.leave_type] || 0) + 1;
          return acc;
        }, {})
      };

      // Calculate task statistics
      const taskStats = {
        total: todos.length,
        completed: todos.filter(t => t.completed).length,
        pending: todos.filter(t => !t.completed).length,
        byPriority: todos.reduce((acc, t) => {
          acc[t.priority] = (acc[t.priority] || 0) + 1;
          return acc;
        }, {})
      };

      setDashboardData({
        totalEmployees,
        totalDepartments,
        totalAnnouncements,
        pendingLeaveRequests,
        attendanceRate,
        presentToday,
        absentToday,
        leaveToday,
        departmentStats,
        leaveStats,
        taskStats
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setRolerId('');
    setMessage('');
    setShowIdInput(true);
  };

  const handleProceed = async () => {
    setMessage('');
    if (!rolerId.trim()) {
      setMessage(`Please enter a ${selectedRole} ID.`);
      return;
    }
    
    try {
      const response = await axios.post('/api/validate-id/', { 
        role: selectedRole, 
        id: rolerId 
      });
      
      if (response.data.valid) {
        if (selectedRole === 'HOD') {
          localStorage.removeItem('selectedPrincipalId');
          localStorage.setItem('selectedHodId', rolerId);
          navigate('/hod');
        } else if (selectedRole === 'Principal') {
          localStorage.removeItem('selectedHodId');
          localStorage.setItem('selectedPrincipalId', rolerId);
          navigate('/principal');
        }
      } else {
        setMessage(response.data.message || `Invalid ${selectedRole} ID.`);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || `Invalid ${selectedRole} ID. Access denied.`);
    }
  };

  const handleCancel = () => {
    setSelectedRole('');
    setRolerId('');
    setMessage('');
    setShowIdInput(false);
  };

  // Chart colors
  const chartColors = {
    primary: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    purple: '#6f42c1',
    green: '#28a745',
    orange: '#fd7e14',
    blue: '#007bff'
  };

  const cardStyle = {
    background: 'var(--color-form-bg)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid var(--color-border)',
    marginBottom: '20px'
  };

  const statCardStyle = {
    background: 'linear-gradient(135deg, var(--color-form-bg), #f8f9fa)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    border: '1px solid var(--color-border)',
    transition: 'transform 0.3s ease'
  };

  const buttonStyle = {
    padding: '15px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'var(--color-background)', 
      color: 'var(--color-text)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--color-sidebar-bg), var(--color-form-bg))',
        padding: '30px',
        borderRadius: '0 0 20px 20px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: 'var(--color-heading)', 
          margin: 0, 
          fontSize: '2.5em',
          fontWeight: '700',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          🛡️ Admin Role Selection
        </h1>
        <p style={{ 
          color: 'var(--color-text)', 
          fontSize: '1.1em',
          marginTop: '10px',
          opacity: 0.9
        }}>
          Select a role to access specific dashboard and operations
        </p>
      </div>

      {!showIdInput ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '20px',
          padding: '20px'
        }}>
          <h2 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>Choose Role to Access:</h2>
          
          <button
            onClick={() => handleRoleSelection('HOD')}
            style={{
              ...buttonStyle,
              backgroundColor: chartColors.primary,
              color: 'white',
              minWidth: '250px',
              fontSize: '1.1em'
            }}
          >
            🎓 Access as HOD
          </button>
          
          <button
            onClick={() => handleRoleSelection('Principal')}
            style={{
              ...buttonStyle,
              backgroundColor: chartColors.purple,
              color: 'white',
              minWidth: '250px',
              fontSize: '1.1em'
            }}
          >
            👔 Access as Principal
          </button>

          {/* Quick Stats Preview */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px', 
            marginTop: '40px',
            width: '100%',
            maxWidth: '800px'
          }}>
            <div style={{ 
              background: 'var(--color-form-bg)', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1.5em', color: chartColors.info, marginBottom: '5px' }}>👥</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--color-heading)' }}>
                {dashboardData.totalEmployees}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--color-text)' }}>
                Total Employees
              </div>
            </div>

            <div style={{ 
              background: 'var(--color-form-bg)', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1.5em', color: chartColors.primary, marginBottom: '5px' }}>🏢</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--color-heading)' }}>
                {dashboardData.totalDepartments}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--color-text)' }}>
                Departments
              </div>
            </div>

            <div style={{ 
              background: 'var(--color-form-bg)', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1.5em', color: chartColors.orange, marginBottom: '5px' }}>📋</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--color-heading)' }}>
                {dashboardData.pendingLeaveRequests}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--color-text)' }}>
                Pending Leave
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>
            Enter {selectedRole} ID:
          </h3>
          
          <input
            type="text"
            value={rolerId}
            onChange={(e) => setRolerId(e.target.value)}
            placeholder={`${selectedRole} ID`}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid var(--color-link)',
              borderRadius: '8px',
              background: 'var(--color-form-bg)',
              color: 'var(--color-text)',
              fontSize: '1em',
              marginBottom: '20px'
            }}
          />
          
          {message && (
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: message.includes('Invalid') || message.includes('denied') ? 'rgba(248, 215, 218, 0.8)' : 'rgba(212, 237, 218, 0.8)',
              color: message.includes('Invalid') || message.includes('denied') ? '#721c24' : '#155724',
              border: message.includes('Invalid') || message.includes('denied') ? '1px solid rgba(245, 198, 203, 0.8)' : '1px solid rgba(195, 230, 203, 0.8)',
              width: '100%',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              {message}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button
              onClick={handleProceed}
              style={{
                ...buttonStyle,
                backgroundColor: chartColors.success,
                color: 'white',
                flex: 1
              }}
            >
              Proceed
            </button>
            
            <button
              onClick={handleCancel}
              style={{
                ...buttonStyle,
                backgroundColor: chartColors.danger,
                color: 'white',
                flex: 1
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;