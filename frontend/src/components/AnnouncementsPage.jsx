import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import ResizableBox from './ResizableBox';

const AnnouncementsPage = ({ username, role }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcementIdToDelete, setAnnouncementIdToDelete] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ task_id: '', description: '' });
  const [editingTodo, setEditingTodo] = useState(null);

  const canCreateAnnouncement = role === 'admin' || role === 'HOD' || role === 'Principal';
  const loggedInName = localStorage.getItem('name');

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/announcements/');
      const allAnnouncements = response.data.announcements;
      
      let filteredAnnouncements = allAnnouncements;
      if (role === 'employee') {
        filteredAnnouncements = allAnnouncements.filter(ann => 
          ann.created_by_role && ['admin', 'HOD', 'Principal'].includes(ann.created_by_role)
        );
      }
      
      setAnnouncements(filteredAnnouncements);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  }, [role]);

  const fetchTodos = useCallback(async () => {
    try {
      const response = await axios.get('/api/todos-json/');
      setTodos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to fetch todos.');
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchTodos();
  }, []);

  // Calculations for initial positioning
  const boxHeight = 800; // Increased height for expanded todo list
  const gap = 20;
  const sidebarWidth = 250; // Defined in App.css
  const mainContentPadding = 30; // 30px on each side for .main-content-area, so 60px total for both sides
  const effectiveClientWidth = window.innerWidth;
  const availableWidth = effectiveClientWidth - sidebarWidth - (mainContentPadding * 2);

  // Give more space to todo box (60% of available width)
  const todoBoxWidth = Math.floor(availableWidth * 0.6);
  const announcementBoxWidth = Math.floor(availableWidth * 0.35);

  // Calculate X for the first box, centered within the available content area
  // Then offset by sidebar and main content area's left padding
  const initialLeftBoxX = ((availableWidth - (todoBoxWidth + announcementBoxWidth + gap)) / 2) + sidebarWidth + mainContentPadding;
  const initialRightBoxX = initialLeftBoxX + todoBoxWidth + gap;

const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.post('/api/announcements/', { 
        title, 
        content,
        created_by: username,
        created_by_role: role
      });
      setMessage(response.data.message);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create announcement.');
    }
  };

  const handleDeleteAnnouncement = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await axios.delete('/api/announcements/', { data: { announcement_id: announcementIdToDelete } });
      setMessage(response.data.message);
      setAnnouncementIdToDelete('');
      fetchAnnouncements();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to delete announcement.');
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = { 
        ...newTodo, 
        created_by_name: loggedInName
      };
      const response = await axios.post('/api/todos-json/', payload);
      setMessage(response.data.message || 'To-Do created successfully.');
      setNewTodo({ task_id: '', description: '' });
      fetchTodos(); // Refresh todos list
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to create todo.');
      console.error('Failed to create todo:', error);
    }
  };

  const handleUpdateTodo = async (id, data) => {
    setMessage('');
    try {
      const payload = {
        ...data,
        modified_by_name: loggedInName
      };
      const response = await axios.put(`/api/todos-json/${id}/`, payload);
      setMessage(response.data.message || 'To-Do updated successfully.');
      if (editingTodo && editingTodo.id === id) {
        setEditingTodo(null);
      }
      fetchTodos(); // Refresh todos list
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update todo.');
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axios.delete(`/api/todos-json/${id}/`);
      fetchTodos(); // Refresh todos list
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('ID copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  const formInputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid var(--color-link)', background: 'var(--color-button-bg)', color: 'var(--color-text)' };
  const formButtonStyle = { padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', transition: 'background-color 0.2s', color: 'white' };
  const createButtonStyle = { ...formButtonStyle, backgroundColor: '#28a745' };
  const deleteButtonStyle = { ...formButtonStyle, backgroundColor: '#dc3545' };



  return (
    <div style={{ 
        padding: '20px', 
        minHeight: '100vh', 
        background: 'var(--color-background)', 
        color: 'var(--color-text)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start', // Align to top
        gap: '20px',
        flexWrap: 'wrap', // Allow wrapping for smaller screens
        width: '100%', // Ensure it takes full width of main-content-area
        boxSizing: 'border-box' // Include padding in width calculation
    }}>
      <ResizableBox default={{ x: initialLeftBoxX, y: 50, width: todoBoxWidth, height: boxHeight }} bounds="body">
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ color: 'var(--color-heading)', marginBottom: '20px', textAlign: 'center' }}>Announcements</h2>
          {message && <p style={{ color: message.includes('failed') ? '#dc3545' : '#28a745', marginBottom: '20px' }}>{message}</p>}

          {loading ? (
            <p style={{ textAlign: 'center', marginTop: '30px', color: 'var(--color-text)' }}>Loading announcements...</p>
          ) : (
            <>
              {canCreateAnnouncement && (
                <>
                  <h3 style={{ color: 'var(--color-heading)', marginTop: '30px', marginBottom: '20px' }}>Create New Announcement</h3>
                  <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px', padding: '20px', border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)'}}>
                    <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={formInputStyle} />
                    <textarea
                      placeholder="Content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows="4"
                      style={formInputStyle}
                    ></textarea>
                    <button type="submit" style={createButtonStyle}>Create Announcement</button>
                  </form>

                  <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>Delete Announcement</h3>
                  <form onSubmit={handleDeleteAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px', padding: '20px', border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)'}}>
                    <input type="text" placeholder="Announcement ID to Delete" value={announcementIdToDelete} onChange={(e) => setAnnouncementIdToDelete(e.target.value)} required style={formInputStyle} />
                    <button type="submit" style={deleteButtonStyle}>Delete Announcement</button>
                  </form>
                </>
              )}

              <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>Current Announcements</h3>
              {announcements.length === 0 ? <p>No announcements yet.</p> : (
                <ul style={{ listStyleType: 'none', padding: 0, border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)'}}>
                  {announcements.map(ann => (
                    <li key={ann.announcement_id} style={{ marginBottom: '10px', padding: '15px', borderBottom: '1px solid rgba(100, 108, 255, 0.1)' }}>
                      <p style={{ marginBottom: '5px' }}><strong>Title:</strong> {ann.title}</p>
                      <p style={{ marginBottom: '5px' }}><strong>Content:</strong> {ann.content}</p>
                      {ann.created_by && ann.created_by_role && (
                        <p style={{ marginBottom: '5px', fontSize: '0.9em', color: 'var(--color-link)' }}><strong>Posted by:</strong> {ann.created_by} ({ann.created_by_role})</p>
                      )}
                      <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong>ID:</strong> {ann.announcement_id}
                        <button
                          onClick={() => copyToClipboard(ann.announcement_id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.8em',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          title="Copy ID"
                        >
                          📋 Copy
                        </button>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </ResizableBox>

      {/* To-Do List Resizable Box */}
      <ResizableBox default={{ x: initialRightBoxX, y: 50, width: announcementBoxWidth, height: boxHeight }} bounds="body">
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 style={{ color: 'var(--color-heading)', marginBottom: '20px' }}>To-Do List</h3>
          <form onSubmit={handleCreateTodo} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px', padding: '20px', border: '1px solid var(--color-link)', borderRadius: '8px', background: 'var(--color-form-bg)'}}>
              <input type="text" placeholder="Task ID" value={newTodo.task_id} onChange={(e) => setNewTodo({...newTodo, task_id: e.target.value})} required style={formInputStyle} />
              <textarea
                  placeholder="Description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                  required
                  rows="4"
                  style={formInputStyle}
              ></textarea>
              <button type="submit" style={createButtonStyle}>Add To-Do</button>
          </form>

          <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-link)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', width: '5%' }}>Sl No</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '10%' }}>Task ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '20%' }}>Description</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '10%' }}>Created By</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '15%' }}>Created Date</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '10%' }}>Modified By</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '15%' }}>Modified Time</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '10%' }}>Progression</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '15%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todos.map((todo, index) => (
                  <tr key={todo.id} style={{ borderBottom: '1px solid rgba(100, 108, 255, 0.1)' }}>
                    <td style={{ padding: '8px' }}>{index + 1}</td>
                    <td style={{ padding: '8px', wordBreak: 'break-word' }}>
                      {editingTodo && editingTodo.id === todo.id ? (
                        <input type="text" value={editingTodo.task_id} onChange={(e) => setEditingTodo({...editingTodo, task_id: e.target.value})} style={{ ...formInputStyle, width: 'calc(100% - 16px)' }} />
                      ) : (
                        todo.task_id
                      )}
                    </td>
                    <td style={{ padding: '8px', wordBreak: 'break-word' }}>
                      {editingTodo && editingTodo.id === todo.id ? (
                        <textarea value={editingTodo.description} onChange={(e) => setEditingTodo({...editingTodo, description: e.target.value})} style={{ ...formInputStyle, width: 'calc(100% - 16px)', minHeight: '60px' }} />
                      ) : (
                        todo.description
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>{todo.created_by_name}</td>
                    <td style={{ padding: '8px' }}>{new Date(todo.created_at).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>{todo.modified_by_name}</td>
                    <td style={{ padding: '8px' }}>{new Date(todo.modified_at).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>
                      {editingTodo && editingTodo.id === todo.id ? (
                        <select value={editingTodo.progression} onChange={(e) => setEditingTodo({...editingTodo, progression: e.target.value})} style={{ ...formInputStyle, width: 'calc(100% - 16px)' }}>
                          <option value="pending">Pending</option>
                          <option value="in_process">In Process</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        todo.progression
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {editingTodo && editingTodo.id === todo.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <button onClick={() => handleUpdateTodo(todo.id, editingTodo)} style={{ ...createButtonStyle, padding: '5px 10px', fontSize: '0.8em' }}>Save</button>
                          <button onClick={() => setEditingTodo(null)} style={{ ...deleteButtonStyle, padding: '5px 10px', fontSize: '0.8em' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <button onClick={() => setEditingTodo(todo)} style={{ ...createButtonStyle, padding: '5px 10px', fontSize: '0.8em' }}>Edit</button>
                          <button onClick={() => handleDeleteTodo(todo.id)} style={{ ...deleteButtonStyle, padding: '5px 10px', fontSize: '0.8em' }}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {todos.length === 0 && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--color-text)' }}>No todos found. Create your first todo above!</p>
            )}
          </div>
        </div>
      </ResizableBox>
    </div>
  );
};

export default AnnouncementsPage;

