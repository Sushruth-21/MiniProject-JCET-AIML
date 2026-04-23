import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const EmployeesView = ({ role }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editMessage, setEditMessage] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const canEdit = role === 'admin' || role === 'HOD' || role === 'Principal';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees/');
      setEmployees(response.data.employees);
      setFilteredEmployees(response.data.employees);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort employees
  useEffect(() => {
    let filtered = employees.filter(emp => {
      const searchLower = searchTerm.toLowerCase();
      return (
        emp.email.toLowerCase().includes(searchLower) ||
        (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
        emp.employee_id.toLowerCase().includes(searchLower)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'name') {
        aValue = (a.name || '').toLowerCase();
        bValue = (b.name || '').toLowerCase();
      } else if (sortBy === 'email') {
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
      } else if (sortBy === 'id') {
        aValue = a.employee_id.toLowerCase();
        bValue = b.employee_id.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, sortBy, sortOrder]);

  const handleEditClick = (employee) => {
    setEditingId(employee.employee_id);
    setEditFormData({
      email: employee.email,
      password: employee.password || '',
      name: employee.name || '',
    });
    setEditMessage('');
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async (employeeId) => {
    setEditMessage('');
    try {
      const payload = {
        role: 'employee',
        id: employeeId,
        ...editFormData
      };
      await axios.put('/api/principal/', payload);
      setEditMessage('Employee updated successfully.');
      setEditingId(null);
      fetchEmployees();
    } catch (error) {
      setEditMessage(error.response?.data?.error || 'Failed to update employee.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    setEditMessage('');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <ResizableBox default={{ x: window.innerWidth / 2 - 500, y: 50, width: 1000, height: 'auto' }}>
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <h2 style={{ color: 'var(--color-heading)', marginBottom: '20px', textAlign: 'center' }}>Employee List</h2>
      {message && <p style={{ color: '#dc3545', marginBottom: '20px' }}>{message}</p>}

      {/* Filter and Sort Section */}
      <div style={{ marginBottom: '25px', padding: '20px', border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-input-bg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label htmlFor="searchTerm" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Search:</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '5px', background: 'var(--color-background)', color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <label htmlFor="sortBy" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Sort By:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '5px', background: 'var(--color-background)', color: 'var(--color-text)' }}
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="id">Employee ID</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Order:</label>
            <button
              onClick={toggleSortOrder}
              style={{ width: '100%', padding: '10px', background: 'var(--color-link)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em', fontWeight: '600' }}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: '0.9em', color: 'var(--color-text)', textAlign: 'right' }}>
          Found: <strong>{filteredEmployees.length}</strong> employee(s)
        </p>
      </div>

      <h3 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>Existing Employees</h3>

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)' }}>Loading employee list...</p>
      ) : (
        filteredEmployees.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text)' }}>
            {employees.length === 0 ? 'No employees found.' : 'No employees match your search criteria.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ background: 'var(--color-header-bg)', borderBottom: '1px solid var(--color-link)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Employee ID</th>
                  {canEdit && <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <React.Fragment key={emp.employee_id}>
                    {editingId === emp.employee_id ? (
                      <tr style={{ background: 'var(--color-input-bg)', borderBottom: '1px solid rgba(100, 108, 255, 0.1)' }}>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => handleEditChange('email', e.target.value)}
                            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>{emp.employee_id}</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleSaveEdit(emp.employee_id)}
                            style={{ padding: '6px 12px', marginRight: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.9em' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.9em' }}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr style={{ borderBottom: '1px solid rgba(100, 108, 255, 0.1)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-input-bg)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px' }}><strong>{emp.name || '-'}</strong></td>
                        <td style={{ padding: '12px' }}>{emp.email}</td>
                        <td style={{ padding: '12px' }}>{emp.employee_id}</td>
                        {canEdit && (
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => handleEditClick(emp)}
                              style={{ padding: '6px 12px', background: 'var(--color-link)', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.9em' }}
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      
      {editMessage && (
        <p style={{ marginTop: '20px', color: editMessage.includes('Failed') ? '#dc3545' : '#28a745', textAlign: 'center', fontWeight: '600' }}>
          {editMessage}
        </p>
      )}
    </div>
    </ResizableBox>
  );
};

EmployeesView.displayName = 'EmployeesView';

export default EmployeesView;

