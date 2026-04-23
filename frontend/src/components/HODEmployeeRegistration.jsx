import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const HODEmployeeRegistration = () => {
  const [hodEmail, setHodEmail] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current HOD's email (either native HOD or admin acting as HOD)
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    
    if (userRole === 'HOD') {
      setHodEmail(username);
    } else if (userRole === 'admin') {
      // If admin is acting as HOD, get the selected HOD's email
      const selectedHodId = localStorage.getItem('selectedHodId');
      if (selectedHodId) {
        // Find HOD data by ID
        const fetchHODEmail = async () => {
          try {
            const response = await axios.get('/api/principal/');
            const hods = response.data.hods || [];
            const foundHod = hods.find(h => h.hod_id === selectedHodId);
            if (foundHod) {
              setHodEmail(foundHod.email);
            }
          } catch (error) {
            console.error('Error fetching HOD data:', error);
          }
        };
        fetchHODEmail();
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validate employee ID is provided
    if (!employeeId.trim()) {
      setMessage('Employee ID is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/employees/add/', {
        name,
        email,
        password,
        employee_id: employeeId, // Employee ID is now mandatory
        dob,
        phone,
        hod_email: hodEmail // Include HOD email for assignment
      });

      setMessage(response.data.message || 'Employee registered successfully!');
      
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setEmployeeId('');
      setDob('');
      setPhone('');
      
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to register employee.');
    } finally {
      setLoading(false);
    }
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
    <ResizableBox default={{ x: window.innerWidth / 2 - 300, y: 100, width: 600, height: 'auto' }}>
      <div style={{ 
        padding: '30px', 
        background: 'var(--color-background)', 
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <h2 style={{ color: 'var(--color-heading)', marginBottom: '30px', textAlign: 'center' }}>
          👥 Register New Employee
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={formInputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={formInputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              Employee ID *
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter unique employee ID"
              required
              style={formInputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={formInputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={formInputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            {loading ? 'Registering...' : '👥 Register Employee'}
          </button>
        </form>

        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: 'var(--color-form-bg)', 
          borderRadius: '10px', 
          border: '1px solid var(--color-link)'
        }}>
          <h4 style={{ color: 'var(--color-heading)', marginBottom: '15px' }}>📋 Instructions:</h4>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>All fields marked with * are required</li>
            <li>Employee ID must be unique and manually entered</li>
            <li>Registered employees will appear in your HOD Dashboard</li>
            <li>You can manage employee assignments through Principal Dashboard</li>
          </ul>
        </div>
      </div>
    </ResizableBox>
  );
};

export default HODEmployeeRegistration;