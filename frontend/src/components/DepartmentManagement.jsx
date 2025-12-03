import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showEmployeeAssign, setShowEmployeeAssign] = useState(false);
  const [showEmployeeView, setShowEmployeeView] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      console.log('DEBUG: Starting fetchDepartments...');
      
      // Fetch departments from API
      const response = await axios.get('/api/departments/');
      console.log('DEBUG: Departments API response:', response);
      console.log('DEBUG: Departments data:', response.data);
      console.log('DEBUG: Departments array:', response.data.departments);
      
      const departmentsArray = response.data.departments || [];
      console.log('DEBUG: Setting departments to:', departmentsArray);
      setDepartments(departmentsArray);
      
      // Also fetch employees for assignment
      const empResponse = await axios.get('/api/employees/');
      console.log('DEBUG: Fetched employees:', empResponse.data);
      const employeesArray = empResponse.data.employees || [];
      console.log('DEBUG: All employees:', employeesArray);
      console.log('DEBUG: Employee assigned_hod values:', employeesArray.map(emp => ({id: emp.employee_id, name: emp.name, assigned_hod: emp.assigned_hod})));
      console.log('DEBUG: Unassigned employees count:', employeesArray.filter(emp => !emp.assigned_hod || emp.assigned_hod === '').length);
      setEmployees(employeesArray);
      
      console.log('DEBUG: fetchDepartments completed');
    } catch (error) {
      console.error('DEBUG: Fetch departments error:', error);
      setMessage('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('DEBUG: DepartmentManagement component mounted, calling fetchDepartments');
    fetchDepartments();
  }, [refreshKey]);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    console.log('DEBUG: Creating department with data:', newDepartment);

    try {
      const response = await axios.post('/api/departments/', newDepartment);
      console.log('DEBUG: Department creation response:', response.data);
      setMessage(response.data.message || 'Department created successfully!');
      setNewDepartment({ name: '', description: '' });
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } catch (error) {
      console.error('DEBUG: Department creation error:', error.response?.data);
      setMessage(error.response?.data?.error || 'Failed to create department.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    try {
      await axios.delete('/api/departments/', { data: { id: id } });
      setMessage('Department deleted successfully!');
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } catch (error) {
      setMessage('Failed to delete department.');
    }
  };

  const handleAssignEmployee = async (employeeId, departmentId) => {
    console.log('DEBUG: Assigning employee', employeeId, 'to department', departmentId);
    try {
      const response = await axios.post('/api/update-employee/', { 
        employee_id: employeeId, 
        assigned_hod: departmentId 
      });
      console.log('DEBUG: Assignment response:', response.data);
      setMessage('Employee assigned to department successfully!');
      setRefreshKey(prev => prev + 1); // Trigger refresh
      setShowEmployeeAssign(false); // Close modal after successful assignment
    } catch (error) {
      console.error('DEBUG: Assignment error:', error.response?.data);
      setMessage('Failed to assign employee to department.');
    }
  };

  const handleUnassignEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to unassign this employee from the department?')) {
      return;
    }
    
    try {
      const response = await axios.post('/api/update-employee/', { 
        employee_id: employeeId, 
        assigned_hod: '' 
      });
      console.log('DEBUG: Unassignment response:', response.data);
      setMessage('Employee unassigned successfully!');
      setRefreshKey(prev => prev + 1); // Trigger refresh
    } catch (error) {
      console.error('DEBUG: Unassignment error:', error.response?.data);
      setMessage('Failed to unassign employee.');
    }
  };

  const getUnassignedEmployees = () => {
    return employees.filter(emp => !emp.assigned_hod || emp.assigned_hod === '' || emp.assigned_hod === null);
  };

  const getAvailableEmployees = (departmentId) => {
    return employees.filter(emp => !emp.assigned_hod || emp.assigned_hod === '' || emp.assigned_hod === null || emp.assigned_hod !== departmentId);
  };

  const getDepartmentEmployees = (departmentId) => {
    return employees.filter(emp => emp.assigned_hod === departmentId);
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : departmentId;
  };

  const formInputStyle = { 
    padding: '10px', 
    borderRadius: '5px', 
    border: '1px solid var(--color-link)', 
    background: 'var(--color-button-bg)', 
    color: 'var(--color-text)',
    width: '100%',
    boxSizing: 'border-box'
  };

  const formButtonStyle = { 
    padding: '12px 20px', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    transition: 'background-color 0.2s', 
    color: 'white',
    fontSize: '1em',
    fontWeight: '600'
  };

  return (
    <ResizableBox default={{ x: window.innerWidth / 2 - 400, y: 100, width: 800, height: 'auto' }}>
      <div style={{ 
        padding: '30px', 
        background: 'var(--color-background)', 
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <h2 style={{ color: 'var(--color-heading)', marginBottom: '30px', textAlign: 'center' }}>
          🏢 Department Management
        </h2>
        
        {message && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
            color: message.includes('success') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '30px' }}>
          {/* Create Department Form */}
          <div style={{ 
            flex: 1, 
            padding: '20px', 
            backgroundColor: 'var(--color-form-bg)', 
            borderRadius: '10px', 
            border: '1px solid var(--color-link)'
          }}>
            <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>Create New Department</h3>
            <form onSubmit={handleCreateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                  Department Name *
                </label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  required
                  style={formInputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                  Description *
                </label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                  required
                  rows="4"
                  style={formInputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...formButtonStyle,
                  backgroundColor: loading ? '#6c757d' : '#28a745',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : '🏢 Create Department'}
              </button>
            </form>
          </div>

          {/* Departments List */}
          <div style={{ 
            flex: 1, 
            padding: '20px', 
            backgroundColor: 'var(--color-form-bg)', 
            borderRadius: '10px', 
            border: '1px solid var(--color-link)'
          }}>
            <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>Existing Departments</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p style={{ color: 'var(--color-text)' }}>Loading departments...</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {departments.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text)', marginTop: '20px' }}>
                    No departments found. Create your first department above.
                  </p>
                ) : (
                  departments.map((dept) => (
                    <div key={dept.id} style={{
                      padding: '15px',
                      marginBottom: '10px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-link)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ color: 'var(--color-heading)', margin: 0 }}>{dept.name}</h4>
                          <p style={{ color: 'var(--color-text)', marginTop: '5px' }}>{dept.description}</p>
                          <div style={{ marginTop: '10px', fontSize: '0.9em', color: 'var(--color-text)' }}>
                            Employees: {getDepartmentEmployees(dept.id).length} | 
                            <button
                              onClick={() => {
                                console.log('DEBUG: Assign button clicked for department:', dept.id, dept.name);
                                setSelectedDepartment(dept.id);
                                setShowEmployeeAssign(true);
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '0.8em',
                                marginLeft: '10px'
                              }}
                              title="Assign Employees"
                            >
                              👥 Assign
                            </button>
                            <button
                              onClick={() => {
                                console.log('DEBUG: View button clicked for department:', dept.id, dept.name);
                                setSelectedDepartment(dept.id);
                                setShowEmployeeView(true);
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '0.8em',
                                marginLeft: '5px'
                              }}
                              title="View Employees"
                            >
                              👁 View
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
                          title="Delete Department"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee Assignment Modal */}
      {showEmployeeAssign && selectedDepartment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-background)',
            padding: '30px',
            borderRadius: '10px',
            width: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--color-heading)', margin: 0 }}>
                Assign Employees to {departments.find(d => d.id === selectedDepartment)?.name}
              </h3>
              <button
                onClick={() => setShowEmployeeAssign(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✖ Close
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>
                Available Employees ({getAvailableEmployees(selectedDepartment).length})
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-link)', borderRadius: '5px' }}>
                {getAvailableEmployees(selectedDepartment).length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text)' }}>
                    No available employees for this department. All employees are either unassigned or assigned to other departments.
                  </p>
                ) : (
                  getAvailableEmployees(selectedDepartment).map(emp => (
                    <div key={emp.employee_id} style={{
                      padding: '10px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.9em', color: 'var(--color-text)' }}>{emp.employee_id}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                          Email: {emp.email || 'N/A'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignEmployee(emp.employee_id, selectedDepartment)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                      >
                        ➕ Add to Department
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
       )}

      {/* Employee View Modal */}
      {showEmployeeView && selectedDepartment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-background)',
            padding: '30px',
            borderRadius: '10px',
            width: '700px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--color-heading)', margin: 0 }}>
                Employees in {departments.find(d => d.id === selectedDepartment)?.name}
              </h3>
              <button
                onClick={() => setShowEmployeeView(false)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✖ Close
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>Assigned Employees</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--color-link)', borderRadius: '5px' }}>
                {getDepartmentEmployees(selectedDepartment).length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text)' }}>No employees assigned to this department.</p>
                ) : (
                  getDepartmentEmployees(selectedDepartment).map(emp => (
                    <div key={emp.employee_id} style={{
                      padding: '15px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.9em', color: 'var(--color-text)' }}>{emp.employee_id}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                          Email: {emp.email || 'N/A'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignEmployee(emp.employee_id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '0.8em'
                        }}
                        title="Unassign Employee"
                      >
                        ➖ Unassign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ResizableBox>
  );
};

export default DepartmentManagement;