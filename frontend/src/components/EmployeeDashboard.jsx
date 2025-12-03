import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ResizableBox from './ResizableBox';

const EmployeeDashboard = ({ username, employeeId }) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    attendedDays: 0,
    leaveDays: 0,
    absentDays: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  // Access control check
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'employee' && userRole !== 'admin') {
      console.error('Unauthorized access attempt to Employee Dashboard by role:', userRole);
      navigate('/hod');
    }
  }, [navigate]);

  const fetchEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch notifications
      const notificationResponse = await axios.get(`/api/notifications/?employee_id=${employeeId}`);
      setNotifications(notificationResponse.data.notifications);

      // Fetch attendance statistics
      const attendanceResponse = await axios.get(`/api/attendance/?employee_id=${employeeId}`);
      setAttendanceStats(attendanceResponse.data.stats || {
        totalDays: 0,
        attendedDays: 0,
        leaveDays: 0,
        absentDays: 0,
        percentage: 0
      });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch employee data.');
    } finally {
      setLoading(false);
    }
  }, [username, employeeId]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);



  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await axios.post('/api/notifications/', { notification_id: notificationId, read_status: true });
      fetchEmployeeData(); // Refresh notifications
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to mark notification as read.');
    }
  };

  const statCardStyle = (color, bgColor) => ({
    textAlign: 'center',
    padding: '20px',
    backgroundColor: bgColor,
    borderRadius: '8px',
    border: `1px solid ${color}`,
    transition: 'transform 0.2s',
    cursor: 'default'
  });


  return (
    <ResizableBox default={{ x: window.innerWidth / 2 - 450, y: 50, width: 900, height: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)' }}>
        <h2 style={{ color: 'var(--color-heading)', marginBottom: '30px', textAlign: 'center' }}>
          Welcome Employee: {username}
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: 'var(--color-text)' }}>Loading employee data...</p>
          </div>
        ) : (
          <div>
            {/* Attendance Statistics */}
            <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px', textAlign: 'center' }}>
              Your Attendance Summary
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '15px', 
              marginBottom: '30px' 
            }}>
              <div style={statCardStyle('#1976d2', '#e3f2fd')}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>
                  {attendanceStats.totalDays}
                </div>
                <div style={{ color: '#1976d2', marginTop: '5px' }}>Total Days</div>
              </div>
              <div style={statCardStyle('#155724', '#d4edda')}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#155724' }}>
                  {attendanceStats.attendedDays}
                </div>
                <div style={{ color: '#155724', marginTop: '5px' }}>Attended Days</div>
              </div>
              <div style={statCardStyle('#856404', '#fff3cd')}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#856404' }}>
                  {attendanceStats.leaveDays}
                </div>
                <div style={{ color: '#856404', marginTop: '5px' }}>Leave Days</div>
              </div>
              <div style={statCardStyle('#721c24', '#f8d7da')}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#721c24' }}>
                  {attendanceStats.absentDays}
                </div>
                <div style={{ color: '#721c24', marginTop: '5px' }}>Absent Days</div>
              </div>
              <div style={statCardStyle('#388e3c', '#e8f5e9')}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>
                  {attendanceStats.percentage}%
                </div>
                <div style={{ color: '#388e3c', marginTop: '5px' }}>Attendance %</div>
              </div>
            </div>

            {/* Performance Graphs Section */}
            <h3 style={{ color: 'var(--color-heading)', marginTop: '30px', marginBottom: '20px', textAlign: 'center' }}>
              Your Performance Analytics
            </h3>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '20px', 
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              {/* Attendance Breakdown Chart */}
              <div style={{ 
                flex: '1', 
                minWidth: '300px',
                backgroundColor: 'var(--color-form-bg)', 
                borderRadius: '12px', 
                padding: '20px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ 
                  color: 'var(--color-heading)', 
                  marginBottom: '15px', 
                  textAlign: 'center',
                  fontSize: '1.1em'
                }}>
                  📊 Attendance Breakdown
                </h4>
                <div style={{ 
                  height: '200px', 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: 'space-around',
                  padding: '10px'
                }}>
                  {/* Present Days Bar */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <div style={{ 
                      width: '60px', 
                      height: `${(attendanceStats.attendedDays / Math.max(attendanceStats.totalDays, 1)) * 150}px`, 
                      backgroundColor: '#28a745', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                      minHeight: '20px'
                    }} />
                    <span style={{ fontSize: '0.9em', color: 'var(--color-text)', fontWeight: 'bold' }}>Present</span>
                    <span style={{ fontSize: '0.8em', color: '#28a745' }}>{attendanceStats.attendedDays}</span>
                  </div>
                  
                  {/* Absent Days Bar */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <div style={{ 
                      width: '60px', 
                      height: `${(attendanceStats.absentDays / Math.max(attendanceStats.totalDays, 1)) * 150}px`, 
                      backgroundColor: '#dc3545', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                      minHeight: '20px'
                    }} />
                    <span style={{ fontSize: '0.9em', color: 'var(--color-text)', fontWeight: 'bold' }}>Absent</span>
                    <span style={{ fontSize: '0.8em', color: '#dc3545' }}>{attendanceStats.absentDays}</span>
                  </div>
                  
                  {/* Leave Days Bar */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <div style={{ 
                      width: '60px', 
                      height: `${(attendanceStats.leaveDays / Math.max(attendanceStats.totalDays, 1)) * 150}px`, 
                      backgroundColor: '#ffc107', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                      minHeight: '20px'
                    }} />
                    <span style={{ fontSize: '0.9em', color: 'var(--color-text)', fontWeight: 'bold' }}>Leave</span>
                    <span style={{ fontSize: '0.8em', color: '#856404' }}>{attendanceStats.leaveDays}</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Graph */}
              <div style={{ 
                flex: '1', 
                minWidth: '300px',
                backgroundColor: 'var(--color-form-bg)', 
                borderRadius: '12px', 
                padding: '20px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ 
                  color: 'var(--color-heading)', 
                  marginBottom: '15px', 
                  textAlign: 'center',
                  fontSize: '1.1em'
                }}>
                  📊 Performance Metrics
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ color: 'var(--color-text)', fontWeight: '500' }}>Attendance Rate</span>
                    <div style={{ 
                      width: '100px', 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${attendanceStats.percentage}%`, 
                        height: '100%', 
                        backgroundColor: '#28a745',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <span style={{ color: '#28a745', fontWeight: '600' }}>{attendanceStats.percentage}%</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ color: 'var(--color-text)', fontWeight: '500' }}>Absent Rate</span>
                    <div style={{ 
                      width: '100px', 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${Math.max(attendanceStats.totalDays > 0 ? (attendanceStats.absentDays / attendanceStats.totalDays) * 100 : 0)}%`, 
                        height: '100%', 
                        backgroundColor: '#dc3545',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <span style={{ color: '#dc3545', fontWeight: '600' }}>
                      {Math.max(attendanceStats.totalDays > 0 ? Math.round((attendanceStats.absentDays / attendanceStats.totalDays) * 100) : 0)}%
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ color: 'var(--color-text)', fontWeight: '500' }}>Leave Usage</span>
                    <div>
                      <div style={{ 
                        width: '100px', 
                        height: '8px', 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: attendanceStats.totalDays > 0 ? `${(attendanceStats.leaveDays / attendanceStats.totalDays) * 100}%` : '0%', 
                          height: '100%', 
                          backgroundColor: '#ffc107',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <span style={{ color: '#856404', fontWeight: '600' }}>
                        {attendanceStats.totalDays > 0 ? Math.round((attendanceStats.leaveDays / attendanceStats.totalDays) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <h3 style={{ color: 'var(--color-heading)', marginTop: '30px', marginBottom: '20px' }}>
              Your Notifications
            </h3>
            {notifications.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '30px', 
                backgroundColor: 'var(--color-form-bg)', 
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}>
                <p style={{ color: 'var(--color-text)', margin: 0 }}>No new notifications.</p>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: 'var(--color-form-bg)', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                marginBottom: '30px'
              }}>
                {notifications.filter(notif => !notif.read_status).map(notif => (
                  <div key={notif.id} style={{ 
                    padding: '15px', 
                    borderBottom: '1px solid var(--color-border)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    ':hover': { backgroundColor: 'var(--color-sidebar-bg)' }
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, marginBottom: '5px', fontWeight: '500' }}>
                        {notif.message}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85em', opacity: 0.7 }}>
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleMarkNotificationAsRead(notif.id)} 
                      style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Mark as Read
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ResizableBox>
  );
};

export default EmployeeDashboard;