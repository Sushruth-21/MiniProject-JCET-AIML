import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ResizableBox from './ResizableBox';

const HODDashboard = ({ username }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [hodData, setHodData] = useState({
    name: '',
    email: '',
    department: '',
    employeesCount: 0,
    pendingLeaves: 0,
    totalTodos: 0
  });

  // Access control check - allow both HOD and admin (with HOD selection)
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const selectedHodId = localStorage.getItem('selectedHodId');
    
    if (userRole !== 'HOD' && !(userRole === 'admin' && selectedHodId)) {
      console.error('Unauthorized access attempt to HOD Dashboard by role:', userRole);
      navigate('/employee');
    }
  }, [navigate]);

  const fetchHODData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get HOD data and statistics
      const db_data = (await axios.get('/api/hod/')).data;
      const allEmployees = db_data.employees || [];
      const allLeaveRequests = db_data.leave_requests || [];
      
      // Get current user's email (either HOD or admin acting as HOD)
      let currentEmail = username;
      
      if (localStorage.getItem('selectedHodId')) {
        // Find HOD data by ID if admin is acting as HOD
        try {
          const hods = (await axios.get('/api/principal/')).data.hods || [];
          const foundHod = hods.find(h => h.hod_id === localStorage.getItem('selectedHodId'));
          if (foundHod) {
            currentEmail = foundHod.email;
          }
        } catch (error) {
          console.error('Error fetching HOD data:', error);
        }
      }

      // Filter employees assigned to this HOD
      const hodEmployees = allEmployees.filter(emp => emp.assigned_hod === currentEmail);
      
      // Filter pending leave requests for this HOD's employees
      const pendingLeaves = allLeaveRequests.filter(req => 
        req.status === 'pending' && 
        req.role === 'employee' &&
        hodEmployees.some(emp => emp.employee_id === req.employee_id)
      );

      // Get todos from JSON storage
      const todosResponse = await axios.get('/api/todos-json/');
      
      const totalTodos = Array.isArray(todosResponse.data) ? todosResponse.data.length : 0;

      setHodData({
        name: username,
        email: currentEmail,
        department: 'General Department', // Can be enhanced later
        employeesCount: hodEmployees.length,
        pendingLeaves: pendingLeaves.length,
        totalTodos: totalTodos
      });

    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch HOD data.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchHODData();
  }, [username, fetchHODData]);

  const statCardStyle = (color, bgColor) => ({
    textAlign: 'center',
    padding: '25px',
    backgroundColor: bgColor,
    borderRadius: '12px',
    border: `2px solid ${color}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  });

  const headerStyle = {
    background: 'linear-gradient(135deg, var(--color-sidebar-bg) 0%, var(--color-link) 100%)',
    color: 'white',
    padding: '30px',
    borderRadius: '15px',
    textAlign: 'center',
    marginBottom: '30px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  };

  

  const infoStyle = {
    padding: '20px',
    backgroundColor: 'var(--color-form-bg)',
    borderRadius: '10px',
    border: '1px solid var(--color-border)'
  };

  return (
    <ResizableBox default={{ x: window.innerWidth / 2 - 500, y: 50, width: 1000, height: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)', minHeight: '100vh' }}>
        
        {/* Header Section */}
        <div style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: '2.5em', fontWeight: '700' }}>
            🎯 HOD Dashboard
          </h1>
          <p style={{ margin: '10px 0 0 0', fontSize: '1.2em', opacity: 0.9 }}>
            Welcome back, {hodData.name}!
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '15px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Department</div>
              <div style={{ fontSize: '1.1em', fontWeight: '600' }}>{hodData.department}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Email</div>
              <div style={{ fontSize: '1.1em', fontWeight: '600' }}>{hodData.email}</div>
            </div>
          </div>
        </div>

        {message && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            borderRadius: '10px',
            backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
            color: message.includes('success') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div style={{ fontSize: '1.2em', color: 'var(--color-text)' }}>Loading HOD dashboard...</div>
          </div>
        ) : (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '40px' }}>
            
            {/* Total Employees Card */}
            <div style={statCardStyle('#1976d2', '#e3f2fd')}>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#1976d2', marginBottom: '10px' }}>
                {'\ud83d\udc65'} {hodData.employeesCount}
              </div>
              <div style={{ fontSize: '1.2em', color: '#1976d2', fontWeight: '500' }}>
                Total Employees
              </div>
</div>

            

            {/* Total Todos Card */}
            <div style={statCardStyle('#9c27b0', '#f3e5f5')}>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#9c27b0', marginBottom: '10px' }}>
                {'\ud83d\udcdd'} {hodData.totalTodos}
              </div>
              <div style={{ fontSize: '1.2em', color: '#9c27b0', fontWeight: '500' }}>
                Total Todos
              </div>
</div>

            {/* Quick Actions Card */}
            <div style={statCardStyle('#28a745', '#d4edda')}>
              <div style={{ fontSize: '1.5em', color: '#28a745', marginBottom: '15px' }}>
                {'\u26a1'} Quick Actions
              </div>
              <div style={{ fontSize: '1.2em', color: '#1976d2', fontWeight: '500' }}>
                Quick Actions
              </div>
            </div>

            {/* Pending Leaves Card */}
            <div style={statCardStyle('#dc3545', '#f8d7da')}>
              <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#dc3545', marginBottom: '10px' }}>
                📋 {hodData.pendingLeaves}
              </div>
              <div style={{ fontSize: '1.2em', color: '#dc3545', fontWeight: '500' }}>
                Pending Leaves
              </div>
            </div>

            {/* Quick Actions Card */}
            <div style={statCardStyle('#28a745', '#d4edda')}>
              <div style={{ fontSize: '1.5em', color: '#28a745', marginBottom: '15px' }}>
                ⚡ Quick Actions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => navigate('/leave-management')}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: 'white',
                    color: '#28a745',
                    border: '2px solid #28a745',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#28a745';
                  }}
                >
                  {'\ud83d\udcdd'} Manage Leave Requests
                 </button>
                <button 
                  onClick={() => navigate('/announcements')}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: 'white',
                    color: '#28a745',
                    border: '2px solid #28a745',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#28a745';
                  }}
>
                   {'\ud83d\udce2'} View Announcements
                  </button>
                  <button 
                    onClick={() => navigate('/register-employee')}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: 'white',
                      color: '#28a745',
                      border: '2px solid #28a745',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1em',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#28a745';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.color = '#28a745';
                    }}
                  >
                    {'\ud83d\udc65'} Register Employee
                   </button>
               </div>
            </div>

            {/* Performance Overview Card */}
            <div style={statCardStyle('#6f42c1', '#e9ecef')}>
              <div style={{ fontSize: '1.5em', color: '#6f42c1', marginBottom: '15px' }}>
                {'\ud83d\udcca'} Performance
              </div>
              <div style={{ textAlign: 'left', fontSize: '1em' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Team Attendance:</strong> 
                  <span style={{ color: '#28a745', fontWeight: '600' }}> Excellent</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Leave Approval Rate:</strong> 
                  <span style={{ color: '#28a745', fontWeight: '600' }}> 98%</span>
                </div>
                <div>
                  <strong>Response Time:</strong> 
                  <span style={{ color: '#28a745', fontWeight: '600' }}> &lt;24hrs</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div style={infoStyle}>
          <h3 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>{'\ud83c\udfaf'} HOD Responsibilities</h3>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li style={{ marginBottom: '10px' }}>✅ Manage employee leave requests and approvals</li>
            <li style={{ marginBottom: '10px' }}>✅ Monitor team attendance and performance</li>
            <li style={{ marginBottom: '10px' }}>✅ Create and manage department announcements</li>
            <li style={{ marginBottom: '10px' }}>✅ Oversee daily operations and team coordination</li>
            <li style={{ marginBottom: '10px' }}>✅ Ensure compliance with company policies</li>
          </ul>
        </div>

        
      </div>
    </ResizableBox>
  );
};

export default HODDashboard;