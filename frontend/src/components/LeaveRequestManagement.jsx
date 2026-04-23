import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaveRequestManagement = ({ userRole, username }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leave-request/');
      setLeaveRequests(response.data.leave_requests);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleStatusChange = async (requestId, newStatus) => {
    setMessage('');
    try {
      const response = await axios.post('/api/leave-request-action/', {
        request_id: requestId,
        status: newStatus,
        reviewed_by: username,
        reviewed_by_role: userRole
      });
      setMessage(response.data.message);
      fetchLeaveRequests();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update leave request.');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#d4edda';
    if (status === 'rejected') return '#f8d7da';
    return '#fff3cd';
  };

  const getStatusTextColor = (status) => {
    if (status === 'approved') return '#155724';
    if (status === 'rejected') return '#721c24';
    return '#856404';
  };

  const formSelectStyle = {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid var(--color-link)',
    background: 'var(--color-background)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '0.9em'
  };

  const buttonStyle = {
    padding: '8px 12px',
    marginLeft: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    color: 'white',
    backgroundColor: 'var(--color-link)'
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-background)', color: 'var(--color-text)', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid var(--color-link)' }}>
      <h2 style={{ color: 'var(--color-heading)', marginBottom: '20px', textAlign: 'center' }}>Leave Request Management</h2>
      {message && <p style={{ color: message.includes('Failed') ? '#dc3545' : '#28a745', marginBottom: '20px', textAlign: 'center' }}>{message}</p>}

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)' }}>Loading leave requests...</p>
      ) : leaveRequests.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)' }}>No leave requests found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: 'var(--color-header-bg)', borderBottom: '1px solid var(--color-link)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Employee ID</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Dates</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Reason</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--color-heading)', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--color-heading)', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map(req => (
                <tr key={req.request_id} style={{ borderBottom: '1px solid rgba(100, 108, 255, 0.1)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-input-bg)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px' }}>{req.employee_id}</td>
                  <td style={{ padding: '12px' }}>{req.start_date} to {req.end_date}</td>
                  <td style={{ padding: '12px' }}>{req.reason}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(req.status),
                      color: getStatusTextColor(req.status)
                    }}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                        <select
                          value={selectedStatus[req.request_id] || ''}
                          onChange={(e) => setSelectedStatus({ ...selectedStatus, [req.request_id]: e.target.value })}
                          style={formSelectStyle}
                        >
                          <option value="">Select Action</option>
                          <option value="approved">Approve</option>
                          <option value="rejected">Reject</option>
                        </select>
                        <button
                          onClick={() => {
                            if (selectedStatus[req.request_id]) {
                              handleStatusChange(req.request_id, selectedStatus[req.request_id]);
                            }
                          }}
                          style={buttonStyle}
                        >
                          Submit
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.9em', color: 'var(--color-text)', opacity: 0.7 }}>No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestManagement;

