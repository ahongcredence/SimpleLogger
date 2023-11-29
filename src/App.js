import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const apiKey = process.env.REACT_APP_API_KEY;

function LogInput() {
  const [log, setLog] = useState({
    systemCode: '',
    logLevel: 'debug',
    message: ''
  });
  const [timestamp, setTimestamp] = useState('');
  const [logHistory, setLogHistory] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const toggleTable = () => {
    fetchLogs();
    setShowTable(!showTable);
  };

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
      setLogHistory(data.bucket_data);
      
    } catch (error) {
      console.error('Error fetching logs: ', error);
    }
  };
  
  

  useEffect(() => {
    
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
    fetchLogs();
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
      console.log(newLog);
      await setLogHistory([...logHistory, newLog]); // Update log history with the new log
      setLog({ systemCode: '', logLevel: 'debug', message: '' });
      await fetchLogs(); // Fetch updated log history
    } catch (error) {
      console.log(apiKey);
      console.error('Error submitting log: ', error);
    }
  };

  // Sort logHistory by timestamp in descending order
  const sortedLogHistory = [...logHistory].sort((a, b) => {
    const timestampA = a.content ? JSON.parse(a.content).timestamp : 0;
    const timestampB = b.content ? JSON.parse(b.content).timestamp : 0;
    return new Date(timestampB) - new Date(timestampA);
  });

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
      
    </div>
      
    <div style={{ textAlign: 'center' }}>
      <button onClick={toggleTable}>Show History</button>
      {showTable && (
        <table style={{ borderCollapse: 'collapse', width: '50%', marginTop: '10px', margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>FileName</th>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>Timestamp</th>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>Log Level</th>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>System Code</th>
              <th style={{ border: '1px solid #dddddd', textAlign: 'left', padding: '8px' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {
            sortedLogHistory.map((logEntry, index) => {  
              const contentObject = logEntry.content ? JSON.parse(logEntry.content) : {};
              return (
                <tr key={index}>
                  <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{logEntry.file_name}</td>
                  <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{contentObject.timestamp}</td>
                  <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{contentObject.severity}</td>
                  <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{contentObject.systemCode}</td>
                  <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{contentObject.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>

    </div>
  );
}

export default LogInput;
