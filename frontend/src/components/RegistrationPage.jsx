import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegistrationPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [pfp, setPfp] = useState(null); // For file input
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegistration = async (e) => {
    e.preventDefault();
    setMessage('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('dob', dob);
    if (pfp) {
      formData.append('pfp', pfp);
    }

    try {
      const response = await axios.post('/api/register/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message);
      // Optionally redirect to login page after successful registration
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="login-form-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--color-text)', marginBottom: '30px', fontSize: '2.5em' }}>Register New User</h1>
        <form onSubmit={handleRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Full Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: 'calc(100% - 24px)',
                padding: '12px',
                border: '1px solid var(--color-link)',
                borderRadius: '8px',
                background: 'var(--color-button-bg)',
                color: 'var(--color-text)',
                fontSize: '1em'
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: 'calc(100% - 24px)',
                padding: '12px',
                border: '1px solid var(--color-link)',
                borderRadius: '8px',
                background: 'var(--color-button-bg)',
                color: 'var(--color-text)',
                fontSize: '1em'
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: 'calc(100% - 24px)',
                padding: '12px',
                border: '1px solid var(--color-link)',
                borderRadius: '8px',
                background: 'var(--color-button-bg)',
                color: 'var(--color-text)',
                fontSize: '1em'
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="dob" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Date of Birth:</label>
            <input
              type="date"
              id="dob"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{
                width: 'calc(100% - 24px)',
                padding: '12px',
                border: '1px solid var(--color-link)',
                borderRadius: '8px',
                background: 'var(--color-button-bg)',
                color: 'var(--color-text)',
                fontSize: '1em'
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="pfp" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-text)' }}>Profile Picture:</label>
            <input
              type="file"
              id="pfp"
              accept="image/*"
              onChange={(e) => setPfp(e.target.files[0])}
              style={{
                width: 'calc(100% - 24px)',
                padding: '12px',
                border: '1px solid var(--color-link)',
                borderRadius: '8px',
                background: 'var(--color-button-bg)',
                color: 'var(--color-text)',
                fontSize: '1em'
              }}
            />
          </div>
          <button type="submit" style={{
            padding: '12px 20px',
            backgroundColor: 'var(--color-link)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: '600',
            transition: 'background-color 0.25s',
            alignSelf: 'stretch'
          }}>Register</button>
        </form>
        {message && (
          <p style={{
            marginTop: '25px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: message.includes('failed') ? 'rgba(248, 215, 218, 0.8)' : 'rgba(212, 237, 218, 0.8)',
            color: message.includes('failed') ? '#721c24' : '#155724',
            border: message.includes('failed') ? '1px solid rgba(245, 198, 203, 0.8)' : '1px solid rgba(195, 230, 203, 0.8)',
            width: '100%',
            textAlign: 'center'
          }}>
            {message}
          </p>
        )}
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--color-text)' }}>
          Already have an account? <Link to="/" style={{ color: 'var(--color-link)', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegistrationPage;