import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const AttendanceSystem = ({ username, employeeId }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayMarked, setTodayMarked] = useState(false);
  const [stats, setStats] = useState({
    totalDays: 0,
    attendedDays: 0,
    leaveDays: 0,
    absentDays: 0,
    percentage: 0
  });

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true); // Set loading to true before fetch
      const response = await axios.get(`/api/attendance/?username=${username}&employee_id=${employeeId}`);
      setAttendanceData(response.data.attendance || []);
      setStats(response.data.stats || {
        totalDays: 0,
        attendedDays: 0,
        leaveDays: 0,
        absentDays: 0,
        percentage: 0
      });
      
      // Check if today is already marked
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = response.data.attendance?.find(record => record.date === today);
      setTodayMarked(!!todayRecord);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch attendance data.');
    } finally {
      setLoading(false); // Set loading to false after fetch completes
    }
  }, [username]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleMarkAttendance = async () => {
    try {
      setMessage('');
      const response = await axios.post('/api/attendance/', {
        username: username,  // Pass username for backend lookup
        employee_id: employeeId,  // Use proper employeeId
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      });
      
      if (response.data.message) {
        setMessage('Attendance marked successfully!');
        setTodayMarked(true);
        fetchAttendanceData(); // Refresh data
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to mark attendance.');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return '#28a745'; // Green
      case 'absent':
        return '#dc3545'; // Red
      case 'leave':
        return '#ffc107'; // Yellow
      case 'absent':
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Gray
    }
  };

  const getStatusBgColor = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return '#d4edda'; // Light green
      case 'absent':
        return '#f8d7da'; // Light red
      case 'leave':
        return '#fff3cd'; // Light yellow
      case 'absent':
        return '#f8d7da'; // Light red
      default:
        return '#e2e3e5'; // Light gray
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return '✅ Present';
      case 'absent':
        return '❌ Absent';
      case 'leave':
        return '🏖️ Leave';
      case 'absent':
        return '❌ Absent';
      default:
        return status;
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
    borderBottom: '2px solid var(--color-border)'
  };

  const tdStyle = {
    padding: '12px 15px',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text)'
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

  const markButtonStyle = {
    padding: '15px 30px',
    backgroundColor: todayMarked ? '#6c757d' : '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: todayMarked ? 'not-allowed' : 'pointer',
    fontSize: '1.1em',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    opacity: todayMarked ? 0.7 : 1
  };

  return (
    <ResizableBox default={{ x: window.innerWidth / 2 - 500, y: 50, width: 1000, height: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)' }}>
        <h2 style={{ color: 'var(--color-heading)', marginBottom: '30px', textAlign: 'center' }}>
          Attendance System
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

        {/* Mark Attendance Section */}
        <div style={{ 
          marginBottom: '30px', 
          padding: '25px', 
          backgroundColor: 'var(--color-form-bg)', 
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>
            Mark Today's Attendance
          </h3>
          <p style={{ marginBottom: '20px', color: 'var(--color-text)', opacity: 0.8 }}>
            Date: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <button
            onClick={handleMarkAttendance}
            disabled={todayMarked}
            style={markButtonStyle}
          >
            {todayMarked ? '✓ Already Marked' : 'Mark Attendance'}
          </button>
        </div>

        {/* Statistics Cards */}
        <div style={{ 
          marginBottom: '30px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '15px' 
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '8px',
            border: '1px solid #bbdefb'
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>
              {stats.totalDays}
            </div>
            <div style={{ color: '#1976d2', marginTop: '5px' }}>Total Days</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#d4edda', 
            borderRadius: '8px',
            border: '1px solid #c3e6cb'
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#155724' }}>
              {stats.attendedDays}
            </div>
            <div style={{ color: '#155724', marginTop: '5px' }}>Attended Days</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#856404' }}>
              {stats.leaveDays}
            </div>
            <div style={{ color: '#856404', marginTop: '5px' }}>Leave Days</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#f8d7da', 
            borderRadius: '8px',
            border: '1px solid #f5c6cb'
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#721c24' }}>
              {stats.absentDays}
            </div>
            <div style={{ color: '#721c24', marginTop: '5px' }}>Absent Days</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#e8f5e9', 
            borderRadius: '8px',
            border: '1px solid #c8e6c9'
          }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>
              {stats.percentage}%
            </div>
            <div style={{ color: '#388e3c', marginTop: '5px' }}>Attendance %</div>
          </div>
        </div>

        {/* Attendance History Table */}
        <div style={{ overflowX: 'auto' }}>
          <h3 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>Attendance History</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p style={{ color: 'var(--color-text)' }}>Loading attendance data...</p>
            </div>
          ) : attendanceData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p style={{ color: 'var(--color-text)' }}>No attendance records found.</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Marked At</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.slice().reverse().map((record) => (
                  <tr key={record.id} style={{ hover: { backgroundColor: 'var(--color-sidebar-bg)' } }}>
                    <td style={tdStyle}>
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(record.status)}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {record.marked_at ? new Date(record.marked_at).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ResizableBox>
  );
};

export default AttendanceSystem;