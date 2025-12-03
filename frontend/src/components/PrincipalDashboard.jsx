import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ResizableBox from './ResizableBox';

const PrincipalDashboard = ({ username }) => {
  const navigate = useNavigate();
  const [hods, setHods] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [hodLeaveRequests, setHodLeaveRequests] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idToManage, setIdToManage] = useState('');
  const [roleToManage, setRoleToManage] = useState('HOD');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [hodId, setHodId] = useState('');
  
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  

  // EMERGENCY BACKUP: Block HOD from ever rendering this page
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const selectedPrincipalId = localStorage.getItem('selectedPrincipalId');
    
    console.log('[PrincipalDashboard] Backup check:');
    console.log(`  Role: ${userRole}`);
    console.log(`  Has selectedPrincipalId: ${!!selectedPrincipalId}`);
    
    if (userRole === 'HOD') {
      console.error('[PrincipalDashboard] 🚫 BLOCKING HOD FROM ACCESSING PRINCIPAL!');
      navigate('/hod');
      return;
    }
    
    if (userRole === 'admin' && !selectedPrincipalId) {
      console.warn('[PrincipalDashboard] Admin without selectedPrincipalId - redirecting');
      navigate('/admin');
      return;
    }
  }, [navigate]);

  const fetchPrincipalData = async () => {
    try {
      setLoading(true); // Set loading to true before fetch
      const response = await axios.get('/api/principal/');
      setHods(response.data.hods);
      setEmployees(response.data.employees);
      setHodLeaveRequests(response.data.hod_leave_requests);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch principal data.');
    } finally {
      setLoading(false); // Set loading to false after fetch completes
    }
  };

  useEffect(() => {
    fetchPrincipalData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (roleToManage === 'employee') {
        const response = await axios.post('/api/employees/add/', { name, email, password, dob, phone });
        setMessage(response.data.message);
      } else {
        const response = await axios.post('/api/principal/', { 
          role: roleToManage, 
          name,
          email, 
          password,
          hod_id: hodId,
          dob,
          phone
        });
        setMessage(response.data.message);
      }
      setName('');
      setEmail('');
      setPassword('');
      setDob('');
      setPhone('');
      setHodId('');
      fetchPrincipalData();
    } catch (error) {
      setMessage(error.response?.data?.error || `Failed to register ${roleToManage}.`);
    }
  };

  const handleRemove = async (role, id) => {
    setMessage('');
    console.log('Removing user:', { role, id }); // Added console.log
    try {
      const response = await axios.delete('/api/principal/', { data: { role, id } });
      console.log('Remove user response:', response.data); // Added console.log
      setMessage(response.data.message);
      fetchPrincipalData(); // Refresh list
    } catch (error) {
      console.error('Remove user error:', error.response?.data || error.message); // Added console.error
      setMessage(error.response?.data?.error || `Failed to remove ${role}.`);
    }
  };

  const handleEdit = (role, user) => {
    setEditMode(true);
    setRoleToManage(role);
    setIdToManage(role === 'HOD' ? user.hod_id : user.employee_id);
    setName(user.name || '');
    setEmail(user.email);
    setDob(user.dob || '');
    setPhone(user.phone || '');
    setPassword('');
    setMessage('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = {
        role: roleToManage,
        id: idToManage,
        name,
        email,
        dob,
        phone,
        password: password || undefined
      };
      await axios.put('/api/principal/', payload);
      setMessage('Profile updated successfully.');
      setEditMode(false);
      setIdToManage('');
      setName('');
      setEmail('');
      setPassword('');
      setDob('');
      setPhone('');
      fetchPrincipalData();
    } catch (error) {
      setMessage(error.response?.data?.error || `Failed to update ${roleToManage}.`);
    }
  };

  const handlePromoteEmployee = async (employeeId) => {
    setMessage('');
    try {
      const response = await axios.post('/api/principal/', { 
        action: 'promote_to_hod',
        employee_id: employeeId
      });
      setMessage(response.data.message);
      fetchPrincipalData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to promote employee.');
    }
  };

  const handleDemoteHOD = async (hodId) => {
    setMessage('');
    try {
      const response = await axios.post('/api/principal/', { 
        action: 'demote_to_employee',
        hod_id: hodId
      });
      setMessage(response.data.message);
      fetchPrincipalData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to demote HOD.');
    }
  };

  const handleLeaveRequestAction = async (requestId, status) => {
    setMessage('');
    console.log('Processing leave request:', { request_id: requestId, status }); // Added console.log
    try {
      const response = await axios.post('/api/principal/', { request_id: requestId, status });
      console.log('Leave request action response:', response.data); // Added console.log
      setMessage(response.data.message);
      fetchPrincipalData(); // Refresh list
    } catch (error) {
      console.error('Leave request action error:', error.response?.data || error.message); // Added console.error
      setMessage(error.response?.data?.error || `Failed to ${status} leave request.`);
    }
  };

  const formInputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid var(--color-link)', background: 'var(--color-button-bg)', color: 'var(--color-text)' };
  const formButtonStyle = { padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.2s', color: 'white' };
  const registerButtonStyle = { ...formButtonStyle, backgroundColor: '#28a745' }; // Green for register
  const removeButtonStyle = { ...formButtonStyle, backgroundColor: '#dc3545' }; // Red for remove
  const editButtonStyle = { ...formButtonStyle, backgroundColor: '#ffc107', color: '#212529' }; // Yellow for edit
  const saveButtonStyle = { ...formButtonStyle, backgroundColor: 'var(--color-link)' }; // Blue for save

  return (
    <ResizableBox default={{ x: window.innerWidth / 2 - 450, y: 50, width: 900, height: 'auto' }}>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <h2 style={{ color: 'var(--color-heading)', marginBottom: '20px', textAlign: 'center' }}>Welcome Principal: {username}</h2>
      {message && <p style={{ color: message.includes('failed') ? '#dc3545' : '#28a745', marginBottom: '20px' }}>{message}</p>}

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)' }}>Loading Principal data...</p>
      ) : (
        <>
          {editMode ? (
            <>
              <h3 style={{ color: 'var(--color-heading)', marginTop: '30px', marginBottom: '20px' }}>Edit {roleToManage === 'HOD' ? 'HOD' : 'Employee'} Profile</h3>
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px', padding: '20px', border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)', maxWidth: '500px', margin: '0 auto' }}>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required style={formInputStyle} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={formInputStyle} />
                <input type="date" placeholder="Date of Birth" value={dob} onChange={(e) => setDob(e.target.value)} style={formInputStyle} />
                <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={formInputStyle} />
                <input type="password" placeholder="New Password (leave blank to keep current)" value={password} onChange={(e) => setPassword(e.target.value)} style={formInputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={saveButtonStyle}>Save Changes</button>
                  <button type="button" onClick={() => { setEditMode(false); }} style={{ ...formButtonStyle, backgroundColor: '#6c757d' }}>Cancel</button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3 style={{ color: 'var(--color-heading)', marginTop: '30px', marginBottom: '20px' }}>Register HOD/Employee</h3>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px', padding: '20px', border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)', maxWidth: '500px', margin: '0 auto' }}>
               <select value={roleToManage} onChange={(e) => setRoleToManage(e.target.value)} style={formInputStyle}>
                  <option value="HOD">HOD</option>
                  <option value="employee">Employee</option>
                </select>
                {roleToManage === 'HOD' && (
                  <>
                    <input type="text" placeholder="HOD Name" value={name} onChange={(e) => setName(e.target.value)} required style={formInputStyle} />
                    <input type="text" placeholder="HOD ID" value={hodId} onChange={(e) => setHodId(e.target.value)} required style={formInputStyle} />
                    <input type="date" placeholder="Date of Birth" value={dob} onChange={(e) => setDob(e.target.value)} style={formInputStyle} />
                    <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={formInputStyle} />
                  </>
                )}
                {roleToManage === 'employee' && (
                  <>
                    <input type="text" placeholder="Employee Name" value={name} onChange={(e) => setName(e.target.value)} required style={formInputStyle} />
                    <input type="date" placeholder="Date of Birth" value={dob} onChange={(e) => setDob(e.target.value)} style={formInputStyle} />
                    <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} style={formInputStyle} />
                  </>
                )}
                <input type="email" placeholder={`${roleToManage} Email`} value={email} onChange={(e) => setEmail(e.target.value)} required style={formInputStyle} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={formInputStyle} />
                <button type="submit" style={registerButtonStyle}>Register</button>
              </form>
            </>
          )}

          <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>HODs List</h3>
          {hods.length === 0 ? <p>No HODs registered.</p> : (
            <ul style={{ listStyleType: 'none', padding: 0, border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)', maxWidth: '700px', margin: '0 auto' }}>
              {hods.map(hod => (
                <li key={hod.hod_id} style={{ marginBottom: '5px', padding: '10px 15px', borderBottom: '1px solid rgba(100, 108, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{hod.email} (ID: {hod.hod_id})</span>
                  <div>
                    <button onClick={() => handleEdit('HOD', hod)} style={{ ...editButtonStyle, marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDemoteHOD(hod.hod_id)} style={{ ...formButtonStyle, marginRight: '10px', backgroundColor: '#17a2b8' }}>Demote</button>
                    <button onClick={() => handleRemove('HOD', hod.hod_id)} style={removeButtonStyle}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ color: 'var(--color-heading)', marginTop: '40px', marginBottom: '20px' }}>Employees List</h3>
          {employees.length === 0 ? <p>No employees registered.</p> : (
            <ul style={{ listStyleType: 'none', padding: 0, border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)', maxWidth: '700px', margin: '0 auto' }}>
              {employees.map(emp => (
                <li key={emp.employee_id} style={{ marginBottom: '5px', padding: '10px 15px', borderBottom: '1px solid rgba(100, 108, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{emp.email} (ID: {emp.employee_id})</span>
                  <div>
                    <button onClick={() => handleEdit('employee', emp)} style={{ ...editButtonStyle, marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handlePromoteEmployee(emp.employee_id)} style={{ ...formButtonStyle, marginRight: '10px', backgroundColor: '#20c997' }}>Promote to HOD</button>
                    <button onClick={() => handleRemove('employee', emp.employee_id)} style={removeButtonStyle}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ color: 'var(--color-heading)', marginTop: '40px', marginBottom: '20px' }}>Pending HOD Leave Requests</h3>
          {hodLeaveRequests.length === 0 ? <p>No pending HOD leave requests.</p> : (
            <ul style={{ listStyleType: 'none', padding: 0, border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)', maxWidth: '700px', margin: '0 auto' }}>
              {hodLeaveRequests.map(req => (
                <li key={req.request_id} style={{ marginBottom: '10px', borderBottom: '1px solid rgba(100, 108, 255, 0.1)', padding: '15px', borderRadius: '4px' }}>
                  <p style={{ marginBottom: '5px' }}><strong>Employee ID:</strong> {req.employee_id}</p>
                  <p style={{ marginBottom: '5px' }}><strong>Reason:</strong> {req.reason}</p>
                  <p style={{ marginBottom: '10px' }}><strong>Status:</strong> {req.status}</p>
                  <button onClick={() => handleLeaveRequestAction(req.request_id, 'approved')} style={{ padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', transition: 'background-color 0.2s' }}>Approve</button>
                  <button onClick={() => handleLeaveRequestAction(req.request_id, 'rejected')} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Reject</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
    </ResizableBox>
  );
};

PrincipalDashboard.displayName = 'PrincipalDashboard';

export default PrincipalDashboard;