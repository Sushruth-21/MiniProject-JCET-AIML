import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const EmployeeManagementView = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employee-management/');
      setEmployees(response.data.employees || []);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEmployee = useCallback(async (employeeId, employeeName) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete employee "${employeeName}" (ID: ${employeeId})? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete('/api/delete-employee/', {
        data: { employee_id: employeeId }
      });
      
      if (response.data.message) {
        // Refresh employee list after successful deletion
        fetchEmployees();
        setError(`Employee "${employeeName}" deleted successfully.`);
      } else {
        setError(response.data.error || 'Failed to delete employee.');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete employee.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeDetails = useCallback(async (employeeId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/employee-management/?employee_id=${employeeId}`);
      setSelectedEmployee(response.data);
      setViewMode('detail');
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch employee details.');
    } finally {
      setLoading(false);
    }
  }, []);

  const startEditEmployee = useCallback((employee) => {
    setEditingEmployee(employee);
    setEditForm({
      employee_id: employee.employee_id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      assigned_hod: employee.assigned_hod || ''
    });
    setViewMode('edit');
  }, []);

  const updateEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.put('/api/update-employee/', editForm);
      
      if (response.data.message) {
        // Refresh employee list after successful update
        fetchEmployees();
        setViewMode('list');
        setEditingEmployee(null);
        setEditForm({});
        setError('Employee updated successfully.');
      } else {
        setError(response.data.error || 'Failed to update employee.');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update employee.');
    } finally {
      setLoading(false);
    }
  }, [editForm, fetchEmployees]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'present') return matchesSearch && emp.attendance_stats.attendance_percentage >= 75;
    if (filterBy === 'absent') return matchesSearch && emp.attendance_stats.attendance_percentage < 50;
    if (filterBy === 'leave') return matchesSearch && emp.leave_requests_count > 0;
    
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'email') return a.email.localeCompare(b.email);
    if (sortBy === 'attendance') return b.attendance_stats.attendance_percentage - a.attendance_stats.attendance_percentage;
    if (sortBy === 'leave_requests') return b.leave_requests_count - a.leave_requests_count;
    return 0;
  });

  const getStatusColor = (percentage) => {
    if (percentage >= 75) return '#28a745';
    if (percentage >= 50) return '#ffc107';
    return '#dc3545';
  };

  const getStatusBadge = (percentage) => {
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 50) return 'Good';
    return 'Poor';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'var(--color-form-bg)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  const thStyle = {
    backgroundColor: 'var(--color-sidebar-bg)',
    color: 'var(--color-sidebar-text)',
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid var(--color-border)',
    cursor: 'pointer',
    userSelect: 'none'
  };

  const tdStyle = {
    padding: '12px 15px',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text)'
  };

  if (loading && !selectedEmployee) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading employees...</p>
      </div>
    );
  }

  if (viewMode === 'edit' && editingEmployee) {
    return (
      <ResizableBox default={{ x: 50, y: 50, width: 800, height: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '20px', backgroundColor: 'var(--color-form-bg)', borderRadius: '8px' }}>
            <h2 style={{ margin: 0, color: 'var(--color-heading)' }}>Edit Employee</h2>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-link)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ← Cancel
            </button>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{ backgroundColor: 'var(--color-form-bg)', padding: '30px', borderRadius: '8px' }}>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--color-heading)' }}>
                  Employee ID
                </label>
                <input
                  type="text"
                  value={editForm.employee_id}
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '5px',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--color-heading)' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--color-heading)' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--color-heading)' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: 'var(--color-heading)' }}>
                  Assigned HOD
                </label>
                <input
                  type="email"
                  value={editForm.assigned_hod}
                  onChange={(e) => setEditForm({ ...editForm, assigned_hod: e.target.value })}
                  placeholder="HOD email address"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={updateEmployee}
                  disabled={loading || !editForm.name || !editForm.email}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading || !editForm.name || !editForm.email ? '#6c757d' : 'var(--color-link)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading || !editForm.name || !editForm.email ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ResizableBox>
    );
  }

  if (viewMode === 'detail' && selectedEmployee) {
    const attendancePercentage = selectedEmployee.attendance?.stats?.attendance_percentage || 0;
    
    return (
      <ResizableBox default={{ x: 50, y: 50, width: 1200, height: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '20px', backgroundColor: 'var(--color-form-bg)', borderRadius: '8px' }}>
            <h2 style={{ margin: 0, color: 'var(--color-heading)' }}>Employee Management - Details</h2>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-link)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ← Back to List
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Loading employee details...</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: 'var(--color-form-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--color-heading)' }}>Employee Information</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div><strong>Employee ID:</strong> {selectedEmployee.employee?.employee_id}</div>
                    <div><strong>Name:</strong> {selectedEmployee.employee?.name}</div>
                    <div><strong>Email:</strong> {selectedEmployee.employee?.email}</div>
                    <div><strong>Phone:</strong> {selectedEmployee.employee?.phone || 'N/A'}</div>
                    <div><strong>Assigned HOD:</strong> {selectedEmployee.employee?.assigned_hod || 'N/A'}</div>
                    <div><strong>Username:</strong> {selectedEmployee.user_details?.username}</div>
                    <div><strong>Role:</strong> {selectedEmployee.user_details?.role}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-form-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--color-heading)' }}>Attendance Statistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1976d2' }}>
                        {selectedEmployee.attendance?.stats?.total_days || 0}
                      </div>
                      <div style={{ color: '#1976d2' }}>Total Days</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#155724' }}>
                        {selectedEmployee.attendance?.stats?.attended_days || 0}
                      </div>
                      <div style={{ color: '#155724' }}>Attended Days</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#856404' }}>
                        {selectedEmployee.attendance?.stats?.leave_days || 0}
                      </div>
                      <div style={{ color: '#856404' }}>Leave Days</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#721c24' }}>
                        {selectedEmployee.attendance?.stats?.absent_days || 0}
                      </div>
                      <div style={{ color: '#721c24' }}>Absent Days</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '15px', textAlign: 'center', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>
                      {attendancePercentage}%
                    </div>
                    <div style={{ color: '#388e3c' }}>Attendance Percentage</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', backgroundColor: 'var(--color-form-bg)', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--color-heading)' }}>Attendance Records</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Marked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee.attendance?.records?.length > 0 ? (
                        selectedEmployee.attendance.records.map((record) => (
                          <tr key={record.id}>
                            <td style={tdStyle}>{formatDate(record.date)}</td>
                            <td style={tdStyle}>
                              <span style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85em',
                                fontWeight: '600',
                                backgroundColor: record.status === 'present' ? '#d4edda' : 
                                               record.status === 'leave' ? '#fff3cd' : '#f8d7da',
                                color: record.status === 'present' ? '#155724' : 
                                       record.status === 'leave' ? '#856404' : '#721c24',
                                border: `1px solid ${record.status === 'present' ? '#c3e6cb' : 
                                               record.status === 'leave' ? '#ffeaa7' : '#f5c6cb'}`
                              }}>
                                {record.status === 'present' ? '✅ Present' :
                                 record.status === 'leave' ? '🏖️ Leave' : '❌ Absent'}
                              </span>
                            </td>
                            <td style={tdStyle}>{record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ ...tdStyle, textAlign: 'center' }}>
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '20px', backgroundColor: 'var(--color-form-bg)', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--color-heading)' }}>Leave Requests</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Request ID</th>
                        <th style={thStyle}>Leave Type</th>
                        <th style={thStyle}>Start Date</th>
                        <th style={thStyle}>End Date</th>
                        <th style={thStyle}>Reason</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployee.leave_requests?.length > 0 ? (
                        selectedEmployee.leave_requests.map((request) => (
                          <tr key={request.request_id}>
                            <td style={tdStyle}>{request.request_id.substring(0, 8)}...</td>
                            <td style={tdStyle}>{request.leave_type || 'N/A'}</td>
                            <td style={tdStyle}>{formatDate(request.start_date)}</td>
                            <td style={tdStyle}>{formatDate(request.end_date)}</td>
                            <td style={tdStyle}>{request.reason}</td>
                            <td style={tdStyle}>
                              <span style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85em',
                                fontWeight: '600',
                                backgroundColor: getLeaveStatusColor(request.status) + '20',
                                color: getLeaveStatusColor(request.status),
                                border: `1px solid ${getLeaveStatusColor(request.status)}`
                              }}>
                                {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ ...tdStyle, textAlign: 'center' }}>
                            No leave requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </ResizableBox>
    );
  }

  return (
    <ResizableBox default={{ x: 50, y: 50, width: 1400, height: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'var(--color-form-bg)', borderRadius: '8px' }}>
          <h2 style={{ margin: 0, color: 'var(--color-heading)' }}>Employee Management</h2>
          <p style={{ margin: '10px 0 0 0', color: 'var(--color-text)', opacity: 0.8 }}>
            View and manage all registered employees, their attendance records, and leave requests.
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          backgroundColor: 'var(--color-form-bg)', 
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '15px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              fontSize: '14px',
              width: '100%'
            }}
          />
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              fontSize: '14px',
              width: '100%'
            }}
          >
            <option value="all">All Employees</option>
            <option value="present">Good Attendance (&ge; 75%)</option>
            <option value="absent">Poor Attendance (&lt; 50%)</option>
            <option value="leave">Has Leave Requests</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              fontSize: '14px',
              width: '100%'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="attendance">Sort by Attendance %</option>
            <option value="leave_requests">Sort by Leave Requests</option>
          </select>
          
          <button
            onClick={fetchEmployees}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-link)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--color-form-bg)', padding: '20px', borderRadius: '8px' }}>
          {filteredEmployees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>No employees found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle} onClick={() => setSortBy('name')}>Name {sortBy === 'name' && '↕'}</th>
                    <th style={thStyle} onClick={() => setSortBy('email')}>Email {sortBy === 'email' && '↕'}</th>
                    <th style={thStyle}>Employee ID</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Assigned HOD</th>
                    <th style={thStyle} onClick={() => setSortBy('attendance')}>Attendance % {sortBy === 'attendance' && '↕'}</th>
                    <th style={thStyle}>Stats</th>
                    <th style={thStyle} onClick={() => setSortBy('leave_requests')}>Leave Requests {sortBy === 'leave_requests' && '↕'}</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.employee_id}>
                      <td style={tdStyle}>
                        <strong>{employee.name}</strong>
                      </td>
                      <td style={tdStyle}>{employee.email}</td>
                      <td style={tdStyle}>
                        <code style={{ 
                          fontSize: '0.85em', 
                          backgroundColor: 'var(--color-sidebar-bg)', 
                          padding: '2px 6px', 
                          borderRadius: '3px' 
                        }}>
                          {employee.employee_id.substring(0, 8)}...
                        </code>
                      </td>
                      <td style={tdStyle}>{employee.phone}</td>
                      <td style={tdStyle}>{employee.assigned_hod || 'N/A'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '60px',
                            height: '8px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${employee.attendance_stats.attendance_percentage}%`,
                              height: '100%',
                              backgroundColor: getStatusColor(employee.attendance_stats.attendance_percentage)
                            }} />
                          </div>
                          <span style={{
                            fontSize: '0.85em',
                            fontWeight: '600',
                            color: getStatusColor(employee.attendance_stats.attendance_percentage)
                          }}>
                            {employee.attendance_stats.attendance_percentage}%
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75em', color: 'var(--color-text)', opacity: 0.7 }}>
                          {getStatusBadge(employee.attendance_stats.attendance_percentage)}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.8em', lineHeight: '1.4' }}>
                          <div>📅 {employee.attendance_stats.total_days} days</div>
                          <div>✅ {employee.attendance_stats.attended_days} present</div>
                          <div>🏖️ {employee.attendance_stats.leave_days} leave</div>
                          <div>❌ {employee.attendance_stats.absent_days} absent</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          backgroundColor: employee.leave_requests_count > 0 ? '#fff3cd' : '#d4edda',
                          color: employee.leave_requests_count > 0 ? '#856404' : '#155724',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8em',
                          fontWeight: '600'
                        }}>
                          {employee.leave_requests_count}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => fetchEmployeeDetails(employee.employee_id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--color-link)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                            marginRight: '4px'
                          }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => startEditEmployee(employee)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ffc107',
                            color: '#212529',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em',
                            marginRight: '4px'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.employee_id, employee.name)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ResizableBox>
  );
};

export default EmployeeManagementView;