import React, { useState } from 'react';
import axios from 'axios';

function LogInput() {
  const [log, setLog] = useState({
    systemCode: '',
    logLevel: 'debug', // Default to 'debug'
    message: ''
  });

  const handleInputChange = (e) => {
    setLog({ ...log, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    try {
      await axios.post('https://ic2sabz0ck.execute-api.us-east-2.amazonaws.com/default/storeMyLogs1', { ...log, timestamp });
      alert('Log submitted successfully');
      setLog({ systemCode: '', logLevel: 'debug', message: '' }); // Reset log level to 'debug'
    } catch (error) {
      console.error('Error submitting log');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ 
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '300px',
      margin: 'auto',
      height: '100vh',
      justifyContent: 'center',
      backgroundColor: '#333', // Dark background color
      color: '#fff', // Light text color
      padding: '20px',
      borderRadius: '10px', // Rounded corners
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)' // Box shadow for depth
    }}>
      <label htmlFor="systemCode">System Code:</label>
      <input type="text" id="systemCode" name="systemCode" placeholder="Enter System Code" value={log.systemCode} onChange={handleInputChange} />

      <label htmlFor="logLevel">Log Level:</label>
      <select id="logLevel" name="logLevel" value={log.logLevel} onChange={handleInputChange}>
        <option value="debug">Debug</option>
        <option value="trace">Trace</option>
        <option value="error">Error</option>
        <option value="info">Info</option>
      </select>

      <label htmlFor="message">Message:</label>
      <textarea id="message" name="message" placeholder="Enter Message" value={log.message} onChange={handleInputChange} />

      <button type="submit" style={{ backgroundColor: '#4CAF50', color: '#fff', cursor: 'pointer' }}>Submit Log</button>
    </form>
  );
}

export default LogInput;
