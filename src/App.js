import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import LogTable from './LogTable';
const apiKey = process.env.REACT_APP_API_KEY;

function LogInput() {
  const [log, setLog] = useState({
    systemCode: '',
    logLevel: 'debug',
    message: ''
  });
  const [timestamp, setTimestamp] = useState('');
  const [logHistory, setLogHistory] = useState([]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('https://ic2sabz0ck.execute-api.us-east-2.amazonaws.com/default/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      const fetchedLogs = Object.values(data.bucket_data).map((logData) => logData.content).filter((log) => log !== 'null') // Filter out "null" strings
      .map((log) => JSON.parse(log)); // Parse JSON strings
      console.log(fetchedLogs);
      setLogHistory(fetchedLogs);
  
    } catch (error) {
      console.error('Error fetching logs: ', error);
    }
  };
  
  

  useEffect(() => {
    fetchLogs();
    // Update timestamp every second
    const intervalId = setInterval(() => {
      const formattedTimestamp = new Date().toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
      });
      setTimestamp(formattedTimestamp);
    }, 1000);
    
    return () => {
      // Clear interval on component unmount
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures this effect runs once on component mount

  const handleInputChange = (e) => {
    setLog({ ...log, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!log.message.trim()) {
      alert('message is required');
      return;
    }
    const newLog = {
      timestamp: new Date().toLocaleString(),
      systemCode: log.systemCode,
      message: log.message,
      severity: log.logLevel.toUpperCase(),
      source: "LambdaFunction"
    };

    try {
      await axios.post('https://ic2sabz0ck.execute-api.us-east-2.amazonaws.com/default/logs', {'body': newLog, httpMethod:'POST'}, {
        'headers': { 'x-api-key': apiKey, 'Content-Type': 'application/json' } // Add API key and content type headers
      });
      alert('Log submitted successfully!');
      setLogHistory([...logHistory, newLog]); // Update log history with the new log
      setLog({ systemCode: '', logLevel: 'debug', message: '' });
    } catch (error) {
      console.log(apiKey);
      console.error('Error submitting log: ', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Simple Logging Service</h2>
        <p>{timestamp}</p> {/* Display timestamp just below the h2 */}
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

      <div style={{ textAlign: 'center'}}>
      {/* Other content */}
      <LogTable logHistory={logHistory} />
    </div>
      
      

    </div>
  );
}

export default LogInput;
