import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const Dashboard = ({ username }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); // New state for loading

  const fetchDashboardData = async () => {
    try {
      setLoading(true); // Set loading to true before fetch
      const response = await axios.get('/api/dashboard/');
      setDashboardData(response.data);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false); // Set loading to false after fetch completes
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <ResizableBox default={{ x: window.innerWidth / 2 - 500, y: 50, width: 1000, height: 'auto' }}>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <h2 style={{ color: 'var(--color-heading)', marginBottom: '30px', textAlign: 'center' }}>Dashboard: {username}</h2>
      {message && <p style={{ color: '#dc3545', marginBottom: '20px', textAlign: 'center' }}>{message}</p>}

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)' }}>Loading dashboard data...</p>
      ) : (
        dashboardData ? (
          <div style={{ maxWidth: '950px', margin: '0 auto' }}> {/* New wrapper for centering the grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginTop: '30px' }}>
              <div style={{ background: '#e3f2fd', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#1976d2' }}>
                <h4 style={{ color: '#1976d2', fontSize: '1.2em', marginBottom: '10px' }}>Total Employees</h4>
                <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: 0 }}>{dashboardData.total_employees}</p>
              </div>
              <div style={{ background: '#d4edda', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#155724' }}>
                <h4 style={{ color: '#155724', fontSize: '1.2em', marginBottom: '10px' }}>Employees On Leave</h4>
                <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: 0 }}>{dashboardData.on_leave_count}</p>
              </div>
              <div style={{ background: '#fff3cd', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#856404' }}>
                <h4 style={{ color: '#856404', fontSize: '1.2em', marginBottom: '10px' }}>Attendance Percentage</h4>
                <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: 0 }}>{dashboardData.attendance_percentage}</p>
              </div>
              <div style={{ background: '#e3f2fd', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#1976d2' }}>
                <h4 style={{ color: '#1976d2', fontSize: '1.2em', marginBottom: '10px' }}>Total Announcements</h4>
                <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: 0 }}>{dashboardData.total_announcements}</p>
              </div>
              <div style={{ background: '#d4edda', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: '#155724' }}>
                <h4 style={{ color: '#155724', fontSize: '1.2em', marginBottom: '10px' }}>Total To-Do Tasks</h4>
                <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: 0 }}>{dashboardData.total_todos}</p>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)' }}>No dashboard data available.</p>
        )
      )}
    </div>
    </ResizableBox>
  );
};

export default Dashboard;

