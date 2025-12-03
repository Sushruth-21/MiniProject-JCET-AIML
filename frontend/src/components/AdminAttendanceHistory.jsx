import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AdminAttendanceHistory = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee: '',
    employee_name: '',
    department: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [message, setMessage] = useState('');
  const [employees, setEmployees] = useState([]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/attendance/');
      const data = response.data.attendance || [];
      setAttendanceData(data);
      setFilteredData(data);
      
      try {
        const empResponse = await axios.get('/api/employees/');
        setEmployees(empResponse.data.employees || []);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const getEmployeeDetails = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId);
    return employee || { name: 'Unknown', email: 'Unknown', assigned_hod: 'Unassigned' };
  };

  const getDepartmentName = (assignedHod) => {
    if (!assignedHod || assignedHod === 'Unassigned') return 'Unassigned';
    // For now, return the assigned_hod value as is (since departments are stored by name)
    return assignedHod;
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];
    
    if (filters.employee) {
      filtered = filtered.filter(record => 
        record.employee_id.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }
    
    if (filters.employee_name) {
      filtered = filtered.filter(record => {
        const employee = getEmployeeDetails(record.employee_id);
        return employee.name.toLowerCase().includes(filters.employee_name.toLowerCase());
      });
    }
    
    if (filters.department) {
      filtered = filtered.filter(record => {
        const employee = getEmployeeDetails(record.employee_id);
        const deptName = getDepartmentName(employee.assigned_hod);
        return deptName && deptName.toLowerCase().includes(filters.department.toLowerCase());
      });
    }
    
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(record => record.status === filters.status);
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(record => record.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(record => record.date <= filters.dateTo);
    }
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'employee_id':
          aValue = a.employee_id;
          bValue = b.employee_id;
          break;
        case 'employee_name':
          aValue = getEmployeeDetails(a.employee_id).name;
          bValue = getEmployeeDetails(b.employee_id).name;
          break;
        case 'department':
          aValue = getDepartmentName(getEmployeeDetails(a.employee_id).assigned_hod);
          bValue = getDepartmentName(getEmployeeDetails(b.employee_id).assigned_hod);
          break;
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }
      
      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredData(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [attendanceData, filters, employees]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'present': return '#28a745';
      case 'absent': return '#dc3545';
      case 'leave': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status.toLowerCase()) {
      case 'present': return '#d4edda';
      case 'absent': return '#f8d7da';
      case 'leave': return '#fff3cd';
      default: return '#e2e3e5';
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'present': return '✅ Present';
      case 'absent': return '❌ Absent';
      case 'leave': return '🏖️ Leave';
      default: return status;
    }
  };

  const getAttendanceStats = () => {
    const total = filteredData.length;
    const present = filteredData.filter(r => r.status === 'present').length;
    const absent = filteredData.filter(r => r.status === 'absent').length;
    const leave = filteredData.filter(r => r.status === 'leave').length;
    const percentage = total > 0 ? Math.round((present / (total - leave)) * 100) : 0;
    
    return { total, present, absent, leave, percentage };
  };

  const stats = getAttendanceStats();

  const handleSort = (field) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: newOrder
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('ID copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '5px',
    border: '1px solid var(--color-link)',
    backgroundColor: 'var(--color-button-bg)',
    color: 'var(--color-text)',
    fontSize: '0.9em'
  };

  const buttonStyle = {
    padding: '8px 16px',
    marginLeft: '5px',
    border: '1px solid var(--color-link)',
    borderRadius: '5px',
    backgroundColor: 'var(--color-button-bg)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background-color 0.2s'
  };

  const statusBadgeStyle = (status) => ({
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: '600',
    backgroundColor: getStatusBgColor(status),
    color: getStatusColor(status),
    border: `1px solid ${getStatusColor(status)}`,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  });

  return (
    <div style={{ 
      width: '100%',
      maxWidth: '1200px',
      background: 'var(--color-background)', 
      color: 'var(--color-text)'
    }}>
      <h2 style={{ color: 'var(--color-heading)', marginBottom: '30px', textAlign: 'center' }}>
        Admin Attendance History
      </h2>
      
      {message && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ 
        marginBottom: '25px', 
        padding: '20px', 
        backgroundColor: 'var(--color-form-bg)', 
        borderRadius: '8px',
        border: '1px solid var(--color-border)'
      }}>
        <h3 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>Filters & Search</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Employee ID:</label>
            <input
              type="text"
              value={filters.employee}
              onChange={(e) => handleFilterChange('employee', e.target.value)}
              placeholder="Filter by employee ID"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Employee Name:</label>
            <input
              type="text"
              value={filters.employee_name}
              onChange={(e) => handleFilterChange('employee_name', e.target.value)}
              placeholder="Filter by employee name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department:</label>
            <input
              type="text"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              placeholder="Filter by department"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={inputStyle}
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From Date:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To Date:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => setFilters({ employee: '', employee_name: '', department: '', status: 'all', dateFrom: '', dateTo: '', sortBy: 'date', sortOrder: 'desc' })}
            style={buttonStyle}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div style={{ 
        marginBottom: '15px', 
        display: 'flex', 
        justifyContent: 'center',
        gap: '8px' 
      }}>
        <div style={{ 
          width: '80px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#e3f2fd', 
          borderRadius: '4px',
          border: '1px solid #bbdefb'
        }}>
          <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#1976d2' }}>
            {stats.total}
          </div>
          <div style={{ color: '#1976d2', marginTop: '2px', fontSize: '0.7em' }}>Total</div>
        </div>
        <div style={{ 
          width: '80px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#d4edda', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#155724' }}>
            {stats.present}
          </div>
          <div style={{ color: '#155724', marginTop: '2px', fontSize: '0.7em' }}>Present</div>
        </div>
        <div style={{ 
          width: '80px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8d7da', 
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#721c24' }}>
            {stats.absent}
          </div>
          <div style={{ color: '#721c24', marginTop: '2px', fontSize: '0.7em' }}>Absent</div>
        </div>
        <div style={{ 
          width: '80px',
          height: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff3cd', 
          borderRadius: '4px',
          border: '1px solid #ffeaa7'
        }}>
          <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#856404' }}>
            {stats.leave}
          </div>
          <div style={{ color: '#856404', marginTop: '2px', fontSize: '0.7em' }}>Leave</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'var(--color-text)' }}>Loading attendance data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'var(--color-text)' }}>No attendance records found matching filters.</p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'var(--color-form-bg)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr>
                <th style={{
                  backgroundColor: 'var(--color-sidebar-bg)',
                  color: 'var(--color-sidebar-text)',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid var(--color-border)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('employee_id')}>
                  Employee ID {filters.sortBy === 'employee_id' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{
                  backgroundColor: 'var(--color-sidebar-bg)',
                  color: 'var(--color-sidebar-text)',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid var(--color-border)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('employee_name')}>
                  Employee Name {filters.sortBy === 'employee_name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{
                  backgroundColor: 'var(--color-sidebar-bg)',
                  color: 'var(--color-sidebar-text)',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid var(--color-border)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('department')}>
                  Department {filters.sortBy === 'department' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{
                  backgroundColor: 'var(--color-sidebar-bg)',
                  color: 'var(--color-sidebar-text)',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid var(--color-border)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('date')}>
                  Date {filters.sortBy === 'date' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{
                  backgroundColor: 'var(--color-sidebar-bg)',
                  color: 'var(--color-sidebar-text)',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid var(--color-border)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }} onClick={() => handleSort('status')}>
                  Status {filters.sortBy === 'status' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{
                  backgroundColor: 'var(--color-sidebar-bg)',
                  color: 'var(--color-sidebar-text)',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid var(--color-border)'
                }}>Marked At</th>
                <th style={{
                  backgroundColor: 'var(--color-sidebar-bg)',
                  color: 'var(--color-sidebar-text)',
                  padding: '12px 15px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid var(--color-border)'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record) => {
                const employee = getEmployeeDetails(record.employee_id);
                return (
                <tr key={record.id}>
                  <td style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontWeight: 'bold'
                  }}>
                    {record.employee_id}
                  </td>
                  <td style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    color: '#1976d2'
                  }}>
                    {employee.name}
                  </td>
                  <td style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    color: '#6f42c1'
                  }}>
                    {getDepartmentName(employee.assigned_hod)}
                  </td>
                  <td style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)'
                  }}>
                    {new Date(record.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)'
                  }}>
                    <span style={statusBadgeStyle(record.status)}>
                      {getStatusText(record.status)}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)'
                  }}>
                    {record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A'}
                  </td>
                  <td style={{ 
                    padding: '12px 15px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)'
                  }}>
                    <button
                      onClick={() => copyToClipboard(record.id)}
                      style={{
                        ...buttonStyle,
                        padding: '6px 12px',
                        fontSize: '0.8em',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none'
                      }}
                      title="Copy ID"
                    >
                      📋 Copy ID
                    </button>
                  </td>
                 </tr>
                 );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

AdminAttendanceHistory.displayName = 'AdminAttendanceHistory';
export default AdminAttendanceHistory;