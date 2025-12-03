import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const LeaveRequestPage = ({ username, employeeId }) => {
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/leave-request/');
      setLeaveRequests(response.data.leave_requests.filter(req => req.employee_id === employeeId));
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleSubmitLeaveRequest = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      setMessage('Please fill in all fields.');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setMessage('End date must be after start date.');
      return;
    }
    
    try {
      const response = await axios.post('/api/leave-request/', { 
        username: username,  // Pass username for backend lookup
        employee_id: employeeId,  // Use proper employeeId
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason, 
        role: 'employee' 
      });
      setMessage(response.data.message);
      setLeaveType('casual');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaveRequests();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit leave request.');
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'granted':
        return 'status-approved';
      case 'rejected':
      case 'refused':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getLeaveTypeText = (type) => {
    switch (type) {
      case 'casual':
        return 'Casual Leave';
      case 'sick':
        return 'Sick Leave';
      case 'earned':
        return 'Earned Leave';
      case 'unpaid':
        return 'Unpaid Leave';
      default:
        return type;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      {/* Leave Section */}
      <div className="leave-section" style={{
        margin: '0 auto',
        maxWidth: '900px'
      }}>
        <h2 style={{
          marginBottom: '20px',
          fontSize: '22px',
          color: '#007bff'
        }}>Leave Application</h2>

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

        {/* Leave Application Form */}
        <ResizableBox
          initialWidth={600}
          initialHeight={400}
          minWidth={400}
          minHeight={300}
          className="leave-form"
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            marginBottom: '30px',
            position: 'relative'
          }}
        >
          <h3 style={{
            marginBottom: '15px',
            fontSize: '18px'
          }}>Apply for Leave</h3>
          <form onSubmit={handleSubmitLeaveRequest}>
            <label style={{
              display: 'block',
              margin: '12px 0 6px',
              fontSize: '14px',
              color: '#333'
            }}>Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>

            <label style={{
              display: 'block',
              margin: '12px 0 6px',
              fontSize: '14px',
              color: '#333'
            }}>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />

            <label style={{
              display: 'block',
              margin: '12px 0 6px',
              fontSize: '14px',
              color: '#333'
            }}>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />

            <label style={{
              display: 'block',
              margin: '12px 0 6px',
              fontSize: '14px',
              color: '#333'
            }}>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for leave"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '80px',
                marginBottom: '15px'
              }}
            ></textarea>

            <button type="submit" style={{
              marginTop: '15px',
              padding: '10px 18px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: '0.3s'
            }}>Submit Application</button>
          </form>
        </ResizableBox>

        {/* Leave History */}
        <div className="leave-history" style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{
            marginBottom: '15px',
            fontSize: '18px'
          }}>Leave History</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Loading leave requests...</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>No leave requests submitted.</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f1f1f1',
                    background: '#f9f9f9',
                    fontWeight: 'bold'
                  }}>Leave Type</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f1f1f1',
                    background: '#f9f9f9',
                    fontWeight: 'bold'
                  }}>From</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f1f1f1',
                    background: '#f9f9f9',
                    fontWeight: 'bold'
                  }}>To</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    borderBottom: '1px solid #f1f1f1',
                    background: '#f9f9f9',
                    fontWeight: 'bold'
                  }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr key={req.request_id}>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid #f1f1f1'
                    }}>
                      {getLeaveTypeText(req.leave_type) || 'Leave'}
                    </td>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid #f1f1f1'
                    }}>
                      {req.start_date || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid #f1f1f1'
                    }}>
                      {req.end_date || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      borderBottom: '1px solid #f1f1f1'
                    }}>
                      <span className={getStatusClass(req.status)} style={{
                        color: getStatusClass(req.status) === 'status-approved' ? 'green' :
                               getStatusClass(req.status) === 'status-rejected' ? 'red' :
                               getStatusClass(req.status) === 'status-pending' ? 'orange' : '#6c757d',
                        fontWeight: 'bold'
                      }}>
                        {getStatusText(req.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestPage;